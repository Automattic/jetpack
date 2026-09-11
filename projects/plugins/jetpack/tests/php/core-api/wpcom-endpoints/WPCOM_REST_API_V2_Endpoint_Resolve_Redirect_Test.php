<?php
/**
 * Tests for the /wpcom/v2/resolve-redirect endpoint.
 *
 * Guards against SSRF-via-redirect: the endpoint may resolve public short
 * links, but must never follow a redirect into an internal / private host.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Resolve_Redirect_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Resolve_Redirect
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Resolve_Redirect::class )]
class WPCOM_REST_API_V2_Endpoint_Resolve_Redirect_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * A loopback URL: must be rejected by wp_http_validate_url().
	 *
	 * @var string
	 */
	const INTERNAL_URL = 'http://127.0.0.1/internal';

	/**
	 * Public entry URL the resolver starts from.
	 *
	 * Uses an RFC 5737 documentation IP literal: the address is non-routable and
	 * HTTP is mocked, so nothing is ever requested over the network. Core's
	 * wp_http_validate_url() lists TEST-NET-1/2/3 among the special-purpose
	 * ranges it rejects, so set_up() allows this one host via
	 * `http_request_host_is_external` -- see allow_fixture_hosts().
	 *
	 * @var string
	 */
	const PUBLIC_START_URL = 'http://203.0.113.10/start';

	/**
	 * A second public URL used as a redirect destination.
	 *
	 * @var string
	 */
	const PUBLIC_FINAL_URL = 'http://198.51.100.20/final';

	/**
	 * A public URL that responds 200 with no redirect.
	 *
	 * @var string
	 */
	const PUBLIC_DIRECT_URL = 'http://203.0.113.10/page';

	/**
	 * An intermediate public URL used to build multi-hop chains.
	 *
	 * @var string
	 */
	const PUBLIC_HOP_URL = 'http://198.51.100.20/hop';

	/**
	 * The link-local cloud-metadata endpoint.
	 *
	 * @var string
	 */
	const METADATA_URL = 'http://169.254.169.254/latest/meta-data/';

	/**
	 * A 100.64.0.0/10 CGNAT address.
	 *
	 * @var string
	 */
	const CGNAT_URL = 'http://100.64.0.1/internal';

	/**
	 * The Azure metadata "Wire Server" address.
	 *
	 * The one reserved address in these tests core's wp_http_validate_url() does
	 * not list, so it reaches the endpoint's check with no filtering at all.
	 *
	 * @var string
	 */
	const AZURE_METADATA_URL = 'http://168.63.129.16/metadata';

	/**
	 * Number of redirects the counted-chain mock issues before returning 200.
	 *
	 * @var int
	 */
	private $chain_length = 0;

	/**
	 * URLs the HTTP layer was actually asked to fetch during a test.
	 *
	 * Populated by the mocks via record_request(). A blocked hop must never
	 * reach the HTTP layer, so asserting a forbidden URL is absent here proves
	 * the endpoint's own validate_url() rejected it -- rather than the request
	 * happening to fail for some other reason (core's own check, network error).
	 *
	 * @var string[]
	 */
	private $requested_urls = array();

	/**
	 * Hosts core's wp_http_validate_url() is told to treat as external.
	 *
	 * @var string[]
	 */
	private $external_hosts = array();

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();

		$this->requested_urls = array();

		// The endpoint's permission_callback is is_user_logged_in().
		wp_set_current_user( static::$user_id );

		// Core's wp_http_validate_url() rejects the RFC 5737 documentation ranges,
		// so the "public" fixtures would never clear param validation.
		$this->external_hosts = array( '203.0.113.10', '198.51.100.20' );

		add_filter( 'http_request_host_is_external', array( $this, 'allow_fixture_hosts' ), 10, 2 );
	}

	/**
	 * Treats the fixture hosts registered for this test as external.
	 *
	 * @param bool   $external Whether the host is considered external.
	 * @param string $host     Host name of the requested URL.
	 * @return bool
	 */
	public function allow_fixture_hosts( $external, $host ) {
		if ( in_array( $host, $this->external_hosts, true ) ) {
			return true;
		}

		return $external;
	}

	/**
	 * Waves a URL's host past core's gate so only the endpoint can reject it.
	 *
	 * Core's reserved-range list now covers nearly everything ip_is_public() does,
	 * so a rejection test that does not do this is answered by core and would pass
	 * even if the endpoint's own check were deleted.
	 *
	 * @param string $url URL whose host should clear wp_http_validate_url().
	 */
	private function allow_host_of( $url ) {
		$this->external_hosts[] = wp_parse_url( $url, PHP_URL_HOST );
	}

	/**
	 * Record a URL the HTTP layer was asked to fetch.
	 *
	 * @param string $url Requested URL.
	 */
	private function record_request( $url ) {
		$this->requested_urls[] = $url;
	}

	/**
	 * Dispatch a request to the endpoint for the given URL.
	 *
	 * @param string $url The URL to resolve.
	 * @return WP_REST_Response
	 */
	private function resolve( $url ) {
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/resolve-redirect/' );
		$request->set_query_params( array( 'url' => $url ) );
		return $this->server->dispatch( $request );
	}

	/**
	 * Resolve a URL with a `pre_http_request` mock active for the dispatch only.
	 *
	 * The mock is removed in a `finally` block, so a failing assertion in the
	 * caller cannot leak the filter into later tests.
	 *
	 * @param string $mock_method Name of the mock method on this class.
	 * @param string $url         The URL to resolve.
	 * @return WP_REST_Response
	 */
	private function resolve_with_mock( $mock_method, $url ) {
		add_filter( 'pre_http_request', array( $this, $mock_method ), 10, 3 );
		try {
			return $this->resolve( $url );
		} finally {
			remove_filter( 'pre_http_request', array( $this, $mock_method ) );
		}
	}

	/**
	 * An internal/loopback URL passed directly is rejected at the param layer.
	 *
	 * Regression for the pre-existing protection: direct internal input must
	 * keep failing validation.
	 */
	public function test_internal_input_is_rejected() {
		$response = $this->resolve( self::INTERNAL_URL );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * The cloud-metadata address passed directly is rejected at the param layer.
	 *
	 * Core is told the host is external, so the endpoint's own reserved-range
	 * check via ip_is_public() is the only thing left to reject it.
	 */
	public function test_metadata_input_is_rejected() {
		$this->allow_host_of( self::METADATA_URL );

		$response = $this->resolve( self::METADATA_URL );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * The Azure metadata address passed directly is rejected at the param layer.
	 *
	 * 168.63.129.16 is absent from core's reserved-range list, so this reaches the
	 * endpoint's check without any filtering: if the whole scheme of waving hosts
	 * past core ever stopped working, this test would still fail on a regression.
	 */
	public function test_azure_metadata_input_is_rejected() {
		$response = $this->resolve( self::AZURE_METADATA_URL );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * A CGNAT (100.64.0.0/10) address passed directly is rejected.
	 *
	 * Guards the explicit 100.64.0.0/10 check, a range PHP's reserved-range
	 * filter does not cover.
	 */
	public function test_cgnat_input_is_rejected() {
		$this->allow_host_of( self::CGNAT_URL );

		$response = $this->resolve( self::CGNAT_URL );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * IPv4 special-use ranges PHP's reserved-range filter leaves open are rejected.
	 *
	 * These ranges (IETF protocol assignments, 6to4 relay anycast, benchmarking,
	 * multicast) pass FILTER_FLAG_NO_RES_RANGE, so ip_is_public()'s explicit range
	 * list is what must reject them. One representative address per range.
	 */
	public function test_reserved_range_inputs_are_rejected() {
		$urls = array(
			'http://192.0.0.192/x',    // RFC 6890 IETF protocol assignments.
			'http://192.88.99.1/x',    // RFC 7526 6to4 relay anycast.
			'http://198.18.0.1/x',     // RFC 2544 benchmarking.
			'http://224.0.0.1/x',      // RFC 5771 multicast.
			'http://239.255.255.250/x', // SSDP multicast.
		);

		foreach ( $urls as $url ) {
			$this->allow_host_of( $url );

			$response = $this->resolve( $url );
			$data     = $response->get_data();

			$this->assertSame( 400, $response->get_status(), $url );
			$this->assertSame( 'rest_invalid_param', $data['code'], $url );
		}
	}

	/**
	 * A host that resolves to no IP address is rejected (fail closed).
	 *
	 * Core stops this one first: wp_http_validate_url() bails when gethostbyname()
	 * fails, before the http_request_host_is_external filter is consulted, so the
	 * endpoint's own empty-IP branch cannot be reached from here. Pins the property
	 * that matters -- an unresolvable host never resolves, whichever layer stops
	 * it. Uses an RFC 2606 .invalid host, guaranteed never to resolve.
	 */
	public function test_unresolvable_host_is_rejected() {
		$response = $this->resolve( 'http://no-such-host.invalid/path' );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * A percent-encoded metadata host is rejected.
	 *
	 * The canonicalization bypass this defends against is the classic way SSRF
	 * filters are defeated, so it earns a regression test even though core stops it
	 * first -- an encoded host fails gethostbyname(), so wp_http_validate_url()
	 * bails before the endpoint's rawurldecode() normalization runs. Pins that such
	 * a host never resolves; the endpoint's decoding stays as defense in depth
	 * should core's gate ever loosen.
	 */
	public function test_percent_encoded_metadata_host_is_rejected() {
		$response = $this->resolve( 'http://169%2e254%2e169%2e254/latest/meta-data/' );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * A bracketed IPv6 loopback literal is rejected.
	 *
	 * Exercises the endpoint's IPv6 handling (bracket stripping in
	 * resolve_host_ips(), ::1 classified as non-public by ip_is_public()) as
	 * defense-in-depth. Core's wp_http_validate_url() already rejects hosts
	 * containing ":", so this also pins that behavior: an IPv6 loopback must never
	 * resolve, whichever layer stops it.
	 */
	public function test_ipv6_loopback_literal_is_rejected() {
		$response = $this->resolve( 'http://[::1]/internal' );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $data['code'] );
	}

	/**
	 * A public URL that 3xx-redirects to the cloud-metadata address is blocked.
	 *
	 * The redirect-hop analogue of test_metadata_input_is_rejected: core is told the
	 * target host is external, so per-hop ip_is_public() is the only thing that can
	 * stop it being fetched.
	 */
	public function test_external_redirect_to_metadata_is_blocked() {
		$this->allow_host_of( self::METADATA_URL );

		$response = $this->resolve_with_mock( 'mock_redirect_to_metadata', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		// The metadata host must be rejected by validate_url() before the HTTP
		// layer is ever asked to fetch it; if it shows up here, per-hop
		// validation is not doing its job.
		$this->assertNotContains( self::METADATA_URL, $this->requested_urls );
		// A blocked hop is reported as a generic WP_Error, and the internal target
		// must never leak into the error payload.
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'http_request_failed', $data['code'] );
		$this->assertStringNotContainsString( '169.254', wp_json_encode( $data, JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * A public URL that 3xx-redirects to an internal IP must NOT be followed.
	 *
	 * This is the SSRF-via-redirect regression: previously the endpoint
	 * followed the redirect and returned the internal destination.
	 */
	public function test_external_redirect_to_internal_is_blocked() {
		$response = $this->resolve_with_mock( 'mock_redirect_to_internal', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		// validate_url() must reject the internal hop before the HTTP layer is
		// asked to fetch it: the internal URL must never reach the request layer.
		$this->assertNotContains( self::INTERNAL_URL, $this->requested_urls );
		// The blocked hop is reported as a generic WP_Error, and the internal target
		// must never leak into the error payload.
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'http_request_failed', $data['code'] );
		$this->assertStringNotContainsString( '127.0.0.1', wp_json_encode( $data, JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * A public URL that redirects to another public URL still resolves.
	 *
	 * Ensures the SSRF fix did not break the endpoint's legitimate purpose of
	 * resolving public short links to their final destination.
	 */
	public function test_external_redirect_to_public_resolves() {
		$response = $this->resolve_with_mock( 'mock_redirect_to_public', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( self::PUBLIC_FINAL_URL, $data['url'] );
		$this->assertSame( 200, $data['status'] );
	}

	/**
	 * A public URL with no redirect returns the URL itself and its status.
	 */
	public function test_no_redirect_returns_input() {
		$response = $this->resolve_with_mock( 'mock_direct_ok', self::PUBLIC_DIRECT_URL );
		$data     = $response->get_data();

		$this->assertSame( self::PUBLIC_DIRECT_URL, $data['url'] );
		$this->assertSame( 200, $data['status'] );
	}

	/**
	 * A redirect chain longer than MAX_REDIRECTS is abandoned, not returned.
	 *
	 * Each hop is a distinct public URL, so it passes validation and the chain
	 * would continue forever. The resolver must stop at the hop limit and must
	 * NOT return the next (never-fetched, never-validated) target as the
	 * destination -- it fails with a too_many_redirects WP_Error instead.
	 */
	public function test_redirect_chain_exceeding_limit_is_not_followed() {
		$response = $this->resolve_with_mock( 'mock_always_redirects', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'too_many_redirects', $data['code'] );
	}

	/**
	 * A URL that redirects to itself fails as a redirect loop.
	 *
	 * Regression for a self-redirect being returned as {url, 3xx status} instead of
	 * an error: a URL whose Location points back at itself is a loop and must fail
	 * with too_many_redirects, exactly like a longer chain, rather than surfacing
	 * the redirecting URL and its 3xx status as a resolved destination.
	 */
	public function test_self_redirect_loop_returns_error() {
		$response = $this->resolve_with_mock( 'mock_self_redirect', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'too_many_redirects', $data['code'] );
	}

	/**
	 * A multi-hop public chain resolves to the final destination.
	 *
	 * The single-hop happy-path test cannot tell "followed the whole chain" from
	 * "returned the first Location". A 2-redirect chain proves the loop actually
	 * iterates and returns the terminal URL, not an intermediate hop.
	 */
	public function test_multi_hop_public_chain_resolves_to_final() {
		$response = $this->resolve_with_mock( 'mock_two_hop_public', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( self::PUBLIC_FINAL_URL, $data['url'] );
		$this->assertSame( 200, $data['status'] );
	}

	/**
	 * A redirect into an internal host on a LATER hop is still blocked.
	 *
	 * This is the core property of per-hop validation: the old code validated
	 * only the input param, so a public->public->internal chain would have
	 * reached the internal host. Validation must re-apply on every hop, not just
	 * the first.
	 */
	public function test_internal_redirect_after_public_hop_is_blocked() {
		$response = $this->resolve_with_mock( 'mock_public_then_internal', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		// The public hop is fetched, but the internal hop after it must be
		// rejected by validate_url() before reaching the HTTP layer.
		$this->assertContains( self::PUBLIC_HOP_URL, $this->requested_urls );
		$this->assertNotContains( self::INTERNAL_URL, $this->requested_urls );
		// The blocked hop is reported as a generic WP_Error, and the internal target
		// must never leak into the error payload.
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'http_request_failed', $data['code'] );
		$this->assertStringNotContainsString( '127.0.0.1', wp_json_encode( $data, JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * A relative Location header is resolved against the current hop's URL.
	 *
	 * Real redirects frequently send a relative Location. The resolved absolute
	 * URL is what gets re-validated and fetched, so this path carries security
	 * weight and must be exercised.
	 */
	public function test_relative_location_is_resolved_against_current_url() {
		$response = $this->resolve_with_mock( 'mock_relative_redirect', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		// "/final" resolved against http://203.0.113.10/start.
		$this->assertSame( 'http://203.0.113.10/final', $data['url'] );
		$this->assertSame( 200, $data['status'] );
	}

	/**
	 * A 3xx response with no Location header returns the current URL and status.
	 *
	 * A redirect with no target is a dead end: the resolver returns the current,
	 * already-validated URL rather than looping or erroring.
	 */
	public function test_redirect_without_location_returns_current_url() {
		$response = $this->resolve_with_mock( 'mock_redirect_without_location', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( self::PUBLIC_START_URL, $data['url'] );
		$this->assertSame( 302, $data['status'] );
	}

	/**
	 * A non-redirect, non-200 final status is returned as-is.
	 */
	public function test_terminal_error_status_is_returned() {
		$response = $this->resolve_with_mock( 'mock_not_found', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( self::PUBLIC_START_URL, $data['url'] );
		$this->assertSame( 404, $data['status'] );
	}

	/**
	 * A chain of exactly MAX_REDIRECTS hops still resolves.
	 *
	 * Pins the inclusive loop boundary: the maximum allowed number of redirects
	 * must succeed, guarding against an off-by-one that would reject legitimate
	 * links sitting right at the limit.
	 */
	public function test_chain_at_redirect_limit_resolves() {
		$this->chain_length = WPCOM_REST_API_V2_Endpoint_Resolve_Redirect::MAX_REDIRECTS;

		$response = $this->resolve_with_mock( 'mock_counted_chain', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( 200, $data['status'] );
	}

	/**
	 * A chain one hop past MAX_REDIRECTS is abandoned.
	 *
	 * The companion to the boundary test above: one redirect beyond the limit
	 * must not be followed, and must not leak the unvalidated target.
	 */
	public function test_chain_past_redirect_limit_is_abandoned() {
		$this->chain_length = WPCOM_REST_API_V2_Endpoint_Resolve_Redirect::MAX_REDIRECTS + 1;

		$response = $this->resolve_with_mock( 'mock_counted_chain', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'too_many_redirects', $data['code'] );
	}

	/**
	 * When a hop returns multiple Location headers, the last one is followed.
	 *
	 * Exercises the is_array() branch in follow_redirect(): a response can carry
	 * more than one Location header, and the resolver must pick the last (matching
	 * core) and re-validate it. The first Location must NOT be fetched, proving the
	 * selection -- not merely that some destination resolved.
	 */
	public function test_multiple_location_headers_follow_last() {
		$response = $this->resolve_with_mock( 'mock_multiple_location_headers', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( self::PUBLIC_FINAL_URL, $data['url'] );
		$this->assertSame( 200, $data['status'] );
		// The first (non-final) Location must never be fetched.
		$this->assertNotContains( self::PUBLIC_HOP_URL, $this->requested_urls );
	}

	/**
	 * A response with no valid HTTP status line is treated as a failed fetch.
	 *
	 * A transport that succeeds but returns an empty/malformed status (status 0)
	 * without tripping is_wp_error() must not be surfaced as a status-0 "success":
	 * it fails closed with a generic error, like any other failed fetch.
	 */
	public function test_empty_status_is_treated_as_failure() {
		$response = $this->resolve_with_mock( 'mock_empty_status', self::PUBLIC_START_URL );
		$data     = $response->get_data();

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'http_request_failed', $data['code'] );
	}

	/**
	 * Mock: the entry URL redirects to an internal IP.
	 *
	 * Only the public entry URL is mocked; any other URL yields a deterministic
	 * error. The internal target is never requested: validate_url() rejects the
	 * loopback host before any HTTP call, so the endpoint's own validation is
	 * what blocks the hop -- and if it ever stopped, the error below would fail
	 * the test instead of a real request being made.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value (unused).
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array|WP_Error
	 */
	public function mock_redirect_to_internal( $preempt, $args, $url ) {
		$this->record_request( $url );
		if ( self::PUBLIC_START_URL === $url ) {
			return $this->redirect_response( self::INTERNAL_URL );
		}
		return $this->unexpected_request( $url );
	}

	/**
	 * Mock: the entry URL redirects to the cloud-metadata address.
	 *
	 * The metadata target is rejected by validate_url() before any request, so
	 * the deterministic error below is never reached in correct code; it exists
	 * so a validation regression fails the test rather than hitting the network.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value (unused).
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array|WP_Error
	 */
	public function mock_redirect_to_metadata( $preempt, $args, $url ) {
		$this->record_request( $url );
		if ( self::PUBLIC_START_URL === $url ) {
			return $this->redirect_response( self::METADATA_URL );
		}
		return $this->unexpected_request( $url );
	}

	/**
	 * Mock: the entry URL redirects to another public URL, which returns 200.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_redirect_to_public( $preempt, $args, $url ) {
		if ( self::PUBLIC_START_URL === $url ) {
			return $this->redirect_response( self::PUBLIC_FINAL_URL );
		}
		return $this->ok_response();
	}

	/**
	 * Mock: every URL redirects to a new, distinct public URL.
	 *
	 * Appending to the path each hop keeps the host public (so validation passes)
	 * while never repeating a URL, producing a chain past MAX_REDIRECTS.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_always_redirects( $preempt, $args, $url ) {
		return $this->redirect_response( $url . '/r' );
	}

	/**
	 * Mock: every URL redirects back to itself, forming a one-URL loop.
	 *
	 * The target host stays public so validation passes on each hop; the resolver
	 * must detect the loop via the hop limit rather than returning the URL.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_self_redirect( $preempt, $args, $url ) {
		return $this->redirect_response( $url );
	}

	/**
	 * Mock: start -> public hop -> public final (200).
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_two_hop_public( $preempt, $args, $url ) {
		if ( self::PUBLIC_START_URL === $url ) {
			return $this->redirect_response( self::PUBLIC_HOP_URL );
		}
		if ( self::PUBLIC_HOP_URL === $url ) {
			return $this->redirect_response( self::PUBLIC_FINAL_URL );
		}
		return $this->ok_response();
	}

	/**
	 * Mock: start -> public hop -> internal IP.
	 *
	 * The internal hop is rejected by validate_url() before any request, exactly
	 * as in production. Any URL beyond the two mocked hops (i.e. the internal
	 * target) yields a deterministic error, so a validation regression fails the
	 * test rather than issuing a real request.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value (unused).
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array|WP_Error
	 */
	public function mock_public_then_internal( $preempt, $args, $url ) {
		$this->record_request( $url );
		if ( self::PUBLIC_START_URL === $url ) {
			return $this->redirect_response( self::PUBLIC_HOP_URL );
		}
		if ( self::PUBLIC_HOP_URL === $url ) {
			return $this->redirect_response( self::INTERNAL_URL );
		}
		return $this->unexpected_request( $url );
	}

	/**
	 * Mock: the entry URL issues a redirect with a relative Location header.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_relative_redirect( $preempt, $args, $url ) {
		if ( self::PUBLIC_START_URL === $url ) {
			return $this->redirect_response( '/final' );
		}
		return $this->ok_response();
	}

	/**
	 * Mock: a 3xx response with no Location header.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_redirect_without_location( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array(
			'headers'  => array(),
			'body'     => '',
			'response' => array(
				'code'    => 302,
				'message' => 'Found',
			),
			'cookies'  => array(),
		);
	}

	/**
	 * Mock: a terminal 404 response with no redirect.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_not_found( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array(
			'headers'  => array(),
			'body'     => '',
			'response' => array(
				'code'    => 404,
				'message' => 'Not Found',
			),
			'cookies'  => array(),
		);
	}

	/**
	 * Mock: redirect $chain_length times (each to a new public URL), then 200.
	 *
	 * Appending "/r" keeps the host public so each hop passes validation while
	 * the path stays unique, letting a chain of an exact length be built.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_counted_chain( $preempt, $args, $url ) {
		if ( substr_count( $url, '/r' ) < $this->chain_length ) {
			return $this->redirect_response( $url . '/r' );
		}
		return $this->ok_response();
	}

	/**
	 * Mock: the URL returns 200 with no redirect.
	 *
	 * Only the direct URL is served; any other URL yields a deterministic error
	 * so an unexpected fetch fails the test rather than hitting the network.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value (unused).
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array|WP_Error
	 */
	public function mock_direct_ok( $preempt, $args, $url ) {
		if ( self::PUBLIC_DIRECT_URL === $url ) {
			return $this->ok_response();
		}
		return $this->unexpected_request( $url );
	}

	/**
	 * Mock: the entry URL returns two Location headers; the last is public final.
	 *
	 * The first header points at PUBLIC_HOP_URL, the last at PUBLIC_FINAL_URL. A
	 * resolver that follows the last header fetches only the final URL; recording
	 * requests lets the test prove the first was never fetched.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_multiple_location_headers( $preempt, $args, $url ) {
		$this->record_request( $url );
		if ( self::PUBLIC_START_URL === $url ) {
			return array(
				'headers'  => array(
					'location' => array( self::PUBLIC_HOP_URL, self::PUBLIC_FINAL_URL ),
				),
				'body'     => '',
				'response' => array(
					'code'    => 302,
					'message' => 'Found',
				),
				'cookies'  => array(),
			);
		}
		return $this->ok_response();
	}

	/**
	 * Mock: the entry URL returns a transport success with no HTTP status line.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value.
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_empty_status( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array(
			'headers'  => array(),
			'body'     => '',
			'response' => array(
				'code'    => 0,
				'message' => '',
			),
			'cookies'  => array(),
		);
	}

	/**
	 * Build a 302 redirect HTTP response array.
	 *
	 * @param string $location The Location header value.
	 * @return array
	 */
	private function redirect_response( $location ) {
		return array(
			'headers'  => array( 'location' => $location ),
			'body'     => '',
			'response' => array(
				'code'    => 302,
				'message' => 'Found',
			),
			'cookies'  => array(),
		);
	}

	/**
	 * Deterministic error for a URL a mock was never meant to serve.
	 *
	 * Returned instead of the incoming $preempt (false), which would let
	 * WordPress fall through to a real network request. If per-hop validation
	 * ever regresses and an internal/blocked hop reaches the HTTP layer, the
	 * test fails fast with this error rather than hanging on a live request.
	 *
	 * @param string $url The unexpected URL.
	 * @return WP_Error
	 */
	private function unexpected_request( $url ) {
		return new WP_Error( 'unexpected_http_request', 'Unexpected HTTP request in test: ' . $url );
	}

	/**
	 * Build a 200 OK HTTP response array.
	 *
	 * @param string $body Optional response body.
	 * @return array
	 */
	private function ok_response( $body = '' ) {
		return array(
			'headers'  => array(),
			'body'     => $body,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
		);
	}
}

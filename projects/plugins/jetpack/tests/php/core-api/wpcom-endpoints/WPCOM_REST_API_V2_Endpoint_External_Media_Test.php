<?php
/**
 * Tests for /wpcom/v2/external-media endpoints.
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_External_Media_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_External_Media
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_External_Media::class )]
class WPCOM_REST_API_V2_Endpoint_External_Media_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Name of test image.
	 *
	 * @var string
	 */
	private $image_name = 'example_image';

	/**
	 * Path to test image.
	 *
	 * @var string
	 */
	private static $image_path;

	/**
	 * URL the media fixtures are downloaded from.
	 *
	 * An RFC 5737 documentation IP literal: non-routable, needs no DNS, and every
	 * HTTP call is mocked. Core's wp_http_validate_url() rejects those ranges, so
	 * set_up() allows this host through -- see allow_public_fixture_hosts().
	 *
	 * @var string
	 */
	const IMAGE_URL = 'http://203.0.113.10/jetpack.jpg';

	/**
	 * A second public URL, used as a redirect destination.
	 *
	 * @var string
	 */
	const REDIRECT_TARGET_URL = 'http://198.51.100.20/jetpack.jpg';

	/**
	 * A link-local address.
	 *
	 * @var string
	 */
	const LINK_LOCAL_URL = 'http://169.254.169.254/latest/meta-data/';

	/**
	 * URLs the HTTP layer was asked to fetch during a test.
	 *
	 * @var string[]
	 */
	private $requested_urls = array();

	/**
	 * Hosts that allow_gate_open_hosts() lets past core's URL validation.
	 *
	 * @var string[]
	 */
	private $gate_open_hosts = array();

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id    = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$image_path = dirname( __DIR__, 2 ) . '/files/jetpack.jpg';
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();

		$this->image_name      = 'example_image-' . getmypid() . '-' . uniqid();
		$this->requested_urls  = array();
		$this->gate_open_hosts = array();

		wp_set_current_user( static::$user_id );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		add_filter( 'http_request_host_is_external', array( $this, 'allow_public_fixture_hosts' ), 10, 2 );
		add_filter( 'http_request_host_is_external', array( $this, 'allow_gate_open_hosts' ), 10, 2 );
	}

	/**
	 * Treats the hosts a rejection test is exercising as external.
	 *
	 * Core's wp_http_validate_url() blocks most internal ranges itself, so a
	 * rejection test written without this passes at core's layer and would keep
	 * passing if the endpoint's own check broke. Opening core's gate for the host
	 * under test leaves that check as the only thing able to reject the URL.
	 *
	 * @param bool   $external Whether the host is considered external.
	 * @param string $host     Host name of the requested URL.
	 * @return bool
	 */
	public function allow_gate_open_hosts( $external, $host ) {
		if ( in_array( $host, $this->gate_open_hosts, true ) ) {
			return true;
		}

		return $external;
	}

	/**
	 * Treats the two documentation-range fixture hosts as external.
	 *
	 * Scoped to those two hosts only: the other addresses the rejection tests use
	 * must keep failing validation.
	 *
	 * @param bool   $external Whether the host is considered external.
	 * @param string $host     Host name of the requested URL.
	 * @return bool
	 */
	public function allow_public_fixture_hosts( $external, $host ) {
		if ( in_array( $host, array( '203.0.113.10', '198.51.100.20' ), true ) ) {
			return true;
		}

		return $external;
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		remove_filter( 'http_request_host_is_external', array( $this, 'allow_public_fixture_hosts' ) );
		remove_filter( 'http_request_host_is_external', array( $this, 'allow_gate_open_hosts' ) );

		parent::tear_down();
	}

	/**
	 * Tests empty list response.
	 */
	public function test_list_pexels_empty() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_pexels' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/external-media/list/pexels' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'found', $data );
		$this->assertArrayHasKey( 'media', $data );
		$this->assertArrayHasKey( 'meta', $data );
		$this->assertArrayHasKey( 'next_page', $data['meta'] );
		$this->assertEmpty( $data['media'] );

		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_pexels' ) );
	}

	/**
	 * Tests list response with unauthenticated Google Photos.
	 */
	public function test_list_google_photos_unauthenticated() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_google_photos_unauthenticated' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/external-media/list/google_photos' );
		$response = $this->server->dispatch( $request );
		$error    = $response->get_data();

		$this->assertArrayHasKey( 'code', $error );
		$this->assertArrayHasKey( 'message', $error );
		$this->assertArrayHasKey( 'data', $error );
		$this->assertEquals( 'authorization_required', $error['code'] );
		$this->assertEquals( 403, $error['data']['status'] );

		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_list_google_photos_unauthenticated' ) );
	}

	/**
	 * Tests copy response with pexels while not setting metadata.
	 */
	public function test_copy_image() {
		add_filter( 'pre_http_request', array( $this, 'mock_image_data' ), 10, 3 );
		add_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		add_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/external-media/copy/pexels' );
		$request->set_body_params(
			array(
				'media' => array(
					array(
						'guid' => wp_json_encode(
							array(
								'url'  => self::IMAGE_URL,
								'name' => $this->image_name,
							),
							JSON_UNESCAPED_SLASHES
						),
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data()[0];

		remove_filter( 'pre_http_request', array( $this, 'mock_image_data' ) );
		remove_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		remove_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'caption', $data );
		$this->assertArrayHasKey( 'alt', $data );
		$this->assertArrayHasKey( 'type', $data );
		$this->assertArrayHasKey( 'url', $data );
		$this->assertEquals( 'image', $data['type'] );
		$this->assertIsInt( $data['id'] );
		$this->assertEmpty( $data['caption'] );
		$this->assertEmpty( $data['alt'] );
	}

	/**
	 * Tests copy response with pexels while setting metadata.
	 */
	public function test_copy_image_meta() {
		add_filter( 'pre_http_request', array( $this, 'mock_image_data' ), 10, 3 );
		add_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		add_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/external-media/copy/pexels' );
		$request->set_body_params(
			array(
				'media' => array(
					array(
						'guid' => wp_json_encode(
							array(
								'url'  => self::IMAGE_URL,
								'name' => $this->image_name,
							),
							JSON_UNESCAPED_SLASHES
						),
						'meta' => array(
							'vertical_id'   => 'v1234',
							'pexels_object' => array(
								'information' => 'goes here',
							),
						),
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data()[0];

		remove_filter( 'pre_http_request', array( $this, 'mock_image_data' ) );
		remove_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		remove_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		// Check API response.
		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'caption', $data );
		$this->assertArrayHasKey( 'alt', $data );
		$this->assertArrayHasKey( 'type', $data );
		$this->assertArrayHasKey( 'url', $data );
		$this->assertEquals( 'image', $data['type'] );
		$this->assertIsInt( $data['id'] );
		$this->assertEmpty( $data['caption'] );
		$this->assertEmpty( $data['alt'] );

		// Look inside the post_meta of the post added.
		$meta = get_post_meta( $data['id'] );
		$this->assertArrayHasKey( 'vertical_id', $meta );
		$this->assertArrayHasKey( 'pexels_object', $meta );
		$this->assertArrayNotHasKey( 'not_allowed_key', $meta );
		$this->assertEquals( 'v1234', $meta['vertical_id'][0] );

		$pexels_object = maybe_unserialize( $meta['pexels_object'][0] );
		$this->assertEquals( 'goes here', $pexels_object['information'] );
	}

	/**
	 * Tests copy response with pexels while setting metadata: Invalid meta keys should fail.
	 */
	public function test_copy_image_meta_invalid_meta_key() {
		add_filter( 'pre_http_request', array( $this, 'mock_image_data' ), 10, 3 );
		add_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		add_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/external-media/copy/pexels' );
		$request->set_body_params(
			array(
				'media' => array(
					array(
						'guid' => wp_json_encode(
							array(
								'url'  => self::IMAGE_URL,
								'name' => $this->image_name,
							),
							JSON_UNESCAPED_SLASHES
						),
						'meta' => array(
							'vertical_id'   => 'v1234',
							'pexels_object' => array(
								'information' => 'goes here',
							),
							'this_meta_key' => 'is_not_allowed',
						),
					),
				),
			)
		);

		$response = $this->server->dispatch( $request );

		remove_filter( 'pre_http_request', array( $this, 'mock_image_data' ) );
		remove_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		remove_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$this->assertEquals( 400, $response->status );
		$this->assertEquals( 'this_meta_key is not a valid property of Object.', $response->data['data']['params']['media'] );
	}

	/**
	 * A user who can upload files but cannot edit the requested parent post must
	 * be refused before any media is copied. Regression test for JETPACK-2409:
	 * the copy endpoint attached media to arbitrary posts because it never checked
	 * edit_post on the request-supplied post_id.
	 */
	public function test_copy_image_denied_when_user_cannot_edit_parent_post() {
		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		// Post owned by the administrator; the author has no rights to edit it.
		$victim_post_id = self::factory()->post->create( array( 'post_author' => static::$user_id ) );

		wp_set_current_user( $author_id );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/external-media/copy/pexels' );
		$request->set_body_params(
			array(
				'post_id' => $victim_post_id,
				'media'   => array(
					array(
						'guid' => wp_json_encode(
							array(
								'url'  => self::IMAGE_URL,
								'name' => $this->image_name,
							),
							JSON_UNESCAPED_SLASHES
						),
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_cannot_edit', $data['code'] );
	}

	/**
	 * A user who can edit the requested parent post is allowed to copy media to
	 * it, and the resulting attachment is parented to that post. Complements
	 * test_copy_image_denied_when_user_cannot_edit_parent_post so the added
	 * authorization check does not over-block legitimate requests.
	 */
	public function test_copy_image_allowed_when_user_can_edit_parent_post() {
		$author_id   = self::factory()->user->create( array( 'role' => 'author' ) );
		$own_post_id = self::factory()->post->create( array( 'post_author' => $author_id ) );

		wp_set_current_user( $author_id );

		add_filter( 'pre_http_request', array( $this, 'mock_image_data' ), 10, 3 );
		add_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		add_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/external-media/copy/pexels' );
		$request->set_body_params(
			array(
				'post_id' => $own_post_id,
				'media'   => array(
					array(
						'guid' => wp_json_encode(
							array(
								'url'  => self::IMAGE_URL,
								'name' => $this->image_name,
							),
							JSON_UNESCAPED_SLASHES
						),
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data()[0];

		remove_filter( 'pre_http_request', array( $this, 'mock_image_data' ) );
		remove_filter( 'wp_handle_sideload_prefilter', array( $this, 'copy_image' ) );
		remove_filter( 'wp_check_filetype_and_ext', array( $this, 'mock_extensions' ) );

		$this->assertArrayHasKey( 'id', $data );
		$this->assertIsInt( $data['id'] );
		$this->assertSame( $own_post_id, get_post( $data['id'] )->post_parent );
	}

	/**
	 * The attacker-controlled guid.name must never influence the physical
	 * temporary file the download is streamed into. Whatever name is supplied,
	 * the temporary file is a random .tmp created by wp_tempnam() inside the
	 * system temp directory — so a crafted name can neither traverse out of that
	 * directory nor pick a dangerous (e.g. .php) extension.
	 *
	 * @dataProvider provide_traversal_names
	 *
	 * @param mixed $malicious_name The attacker-controlled guid.name value.
	 */
	#[DataProvider( 'provide_traversal_names' )]
	public function test_get_download_url_ignores_supplied_name_for_temp_file( $malicious_name ) {
		add_filter( 'pre_http_request', array( $this, 'mock_image_data' ), 10, 3 );

		$endpoint = new WPCOM_REST_API_V2_Endpoint_External_Media();
		$path     = $endpoint->get_download_url(
			array(
				'name' => $malicious_name,
				'url'  => self::IMAGE_URL,
			)
		);

		remove_filter( 'pre_http_request', array( $this, 'mock_image_data' ) );

		$this->assertNotWPError( $path );

		$temp_dir = realpath( get_temp_dir() );
		$base     = basename( $path );

		// Temporary file lives inside the system temp dir, has a safe .tmp
		// extension, and reflects none of the attacker-supplied name.
		$this->assertStringStartsWith( $temp_dir, (string) realpath( $path ) );
		$this->assertStringEndsWith( '.tmp', $base );
		$this->assertStringNotContainsString( '..', $path );
		$this->assertStringNotContainsString( '/', $base );
		$this->assertStringNotContainsString( '\\', $base );
		$this->assertStringNotContainsString( 'rce', $base );

		if ( file_exists( $path ) ) {
			unlink( $path );
		}
	}

	/**
	 * Data provider of crafted guid.name values, none of which may reach the
	 * temporary file name.
	 *
	 * @return array<string, array{0: mixed}>
	 */
	public static function provide_traversal_names() {
		return array(
			'unix traversal into uploads' => array( '../var/www/html/wordpress/wp-content/uploads/rce.php' ),
			'relative parent prefix'      => array( '../../rce.php' ),
			'windows separators'          => array( '..\\..\\rce.php' ),
			'pure traversal'              => array( '../..' ),
			'null name'                   => array( null ),
			'array name'                  => array( array( '../../rce.php' ) ),
		);
	}

	/**
	 * A URL pointing at a non-public address is never fetched.
	 *
	 * Core's gate is opened for each host first, so the endpoint's own check is
	 * what has to do the rejecting.
	 *
	 * @dataProvider provide_internal_urls
	 *
	 * @param string $url The URL to import.
	 */
	#[DataProvider( 'provide_internal_urls' )]
	public function test_get_download_url_rejects_internal_url( $url ) {
		$this->gate_open_hosts = array( (string) wp_parse_url( $url, PHP_URL_HOST ) );
		$this->assertNotFalse( wp_http_validate_url( $url ), "$url should clear core's validation here" );

		$result = $this->download( 'mock_unexpected_request', array( 'url' => $url ) );

		$this->assertWPError( $result );
		$this->assertSame( 'rest_upload_error', $result->get_error_code() );
		$this->assertSame( array(), $this->requested_urls );
	}

	/**
	 * Data provider of internal addresses core's validation can be opened for.
	 *
	 * IP literals only: core rejects any host containing a colon outright, so an
	 * IPv6 address could not be let through to reach the endpoint's own check.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function provide_internal_urls() {
		return array(
			'link-local'       => array( self::LINK_LOCAL_URL ),
			'reserved address' => array( 'http://168.63.129.16/internal.jpg' ),
			'loopback'         => array( 'http://127.0.0.1/internal.jpg' ),
			'private range'    => array( 'http://10.0.0.1/internal.jpg' ),
			'cgnat'            => array( 'http://100.64.0.1/internal.jpg' ),
			'ietf assignments' => array( 'http://192.0.0.192/internal.jpg' ),
		);
	}

	/**
	 * URLs that cannot be fetched at all are rejected before any request.
	 *
	 * Core rejects these too, so this is defense in depth rather than a test of
	 * the endpoint's own check -- UtilsTest covers that layer with core stubbed
	 * open. What it does pin is that the endpoint rejects them itself instead of
	 * handing them to the HTTP layer.
	 *
	 * @dataProvider provide_unfetchable_urls
	 *
	 * @param string $url The URL to import.
	 */
	#[DataProvider( 'provide_unfetchable_urls' )]
	public function test_get_download_url_rejects_unfetchable_url( $url ) {
		$result = $this->download( 'mock_unexpected_request', array( 'url' => $url ) );

		$this->assertWPError( $result );
		$this->assertSame( 'rest_upload_error', $result->get_error_code() );
		$this->assertSame( array(), $this->requested_urls );
	}

	/**
	 * Data provider of URLs no request may be made for.
	 *
	 * @return array<string, array{0: string}>
	 */
	public static function provide_unfetchable_urls() {
		return array(
			'ipv6 loopback'           => array( 'http://[::1]/internal.jpg' ),
			'percent-encoded address' => array( 'http://169%2e254%2e169%2e254/latest/' ),
			'unresolvable host'       => array( 'http://jetpack-external-media.invalid/x.jpg' ),
			'not a url'               => array( 'not a url' ),
			'empty url'               => array( '' ),
		);
	}

	/**
	 * A redirect to a non-public address is not followed.
	 *
	 * The hop analogue of test_get_download_url_rejects_internal_url: core's gate
	 * is opened for the host, so only the endpoint's own per-hop check can stop
	 * the redirect being followed.
	 */
	public function test_get_download_url_does_not_follow_redirect_to_non_public_address() {
		$this->gate_open_hosts = array( '169.254.169.254' );

		$result = $this->download( 'mock_redirect_to_non_public_address' );

		$this->assertWPError( $result );
		$this->assertSame( 'rest_upload_error', $result->get_error_code() );
		$this->assertSame( array( self::IMAGE_URL ), $this->requested_urls );
	}

	/**
	 * A redirect to another public URL is still followed, and the file downloaded.
	 */
	public function test_get_download_url_follows_public_redirect() {
		$result = $this->download( 'mock_redirect_to_public' );

		$this->assertNotWPError( $result );
		$this->assertSame( array( self::IMAGE_URL, self::REDIRECT_TARGET_URL ), $this->requested_urls );

		if ( file_exists( $result ) ) {
			unlink( $result );
		}
	}

	/**
	 * A chain longer than the hop limit is abandoned rather than followed forever.
	 */
	public function test_get_download_url_abandons_chain_past_redirect_limit() {
		$result = $this->download( 'mock_always_redirects' );

		$this->assertWPError( $result );
		$this->assertSame( 'rest_upload_error', $result->get_error_code() );
		$this->assertCount( WPCOM_REST_API_V2_Endpoint_External_Media::MAX_REDIRECTS + 1, $this->requested_urls );
	}

	/**
	 * A request that fails in transit reports the same error as any other failed download.
	 */
	public function test_get_download_url_reports_generic_error_for_transport_failure() {
		$result = $this->download( 'mock_unexpected_request' );

		$this->assertWPError( $result );
		$this->assertSame( 'rest_upload_error', $result->get_error_code() );
		$this->assertSame( array( self::IMAGE_URL ), $this->requested_urls );
	}

	/**
	 * Download a media item with a `pre_http_request` mock active for the call only.
	 *
	 * The mock is removed in a `finally` block, so a failing assertion in the
	 * caller cannot leak the filter into later tests.
	 *
	 * @param string $mock_method Name of the mock method on this class.
	 * @param array  $guid        Media information; defaults to the public fixture URL.
	 * @return string|WP_Error
	 */
	private function download( $mock_method, $guid = array( 'url' => self::IMAGE_URL ) ) {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_External_Media();

		add_filter( 'pre_http_request', array( $this, $mock_method ), 10, 3 );
		try {
			return $endpoint->get_download_url( $guid );
		} finally {
			remove_filter( 'pre_http_request', array( $this, $mock_method ) );
		}
	}

	/**
	 * Mock: the fixture URL redirects to the link-local address.
	 *
	 * The target is rejected before any request, so the deterministic
	 * error below is never reached in correct code; it exists so a validation
	 * regression fails the test rather than hitting the network.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value (unused).
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array|WP_Error
	 */
	public function mock_redirect_to_non_public_address( $preempt, $args, $url ) {
		$this->requested_urls[] = $url;

		if ( self::IMAGE_URL === $url ) {
			return $this->redirect_response( self::LINK_LOCAL_URL );
		}

		return $this->mock_unexpected_request( $preempt, $args, $url );
	}

	/**
	 * Mock: the fixture URL redirects to another public URL, which returns 200.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value (unused).
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array|WP_Error
	 */
	public function mock_redirect_to_public( $preempt, $args, $url ) {
		$this->requested_urls[] = $url;

		if ( self::IMAGE_URL === $url ) {
			return $this->redirect_response( self::REDIRECT_TARGET_URL );
		}

		if ( self::REDIRECT_TARGET_URL === $url ) {
			return array(
				'headers'  => array(),
				'body'     => '',
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
			);
		}

		return $this->mock_unexpected_request( $preempt, $args, $url );
	}

	/**
	 * Mock: every URL redirects to a new, distinct public URL.
	 *
	 * Appending to the path each hop keeps the host public (so validation passes)
	 * while never repeating a URL, producing a chain past the hop limit.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value (unused).
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return array
	 */
	public function mock_always_redirects( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->requested_urls[] = $url;

		return $this->redirect_response( $url . '/r' );
	}

	/**
	 * Mock: a deterministic error for any request the test never meant to make.
	 *
	 * Returned instead of the incoming $preempt (false), which would let WordPress
	 * fall through to a real network request. If validation ever regresses and a
	 * blocked URL reaches the HTTP layer, the test fails fast rather than hanging.
	 *
	 * @param false|array|WP_Error $preempt Short-circuit value (unused).
	 * @param array                $args    Request args.
	 * @param string               $url     Request URL.
	 * @return WP_Error
	 */
	public function mock_unexpected_request( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->requested_urls[] = $url;

		return new WP_Error( 'unexpected_http_request', 'Unexpected HTTP request in test: ' . $url );
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
	 * The finished download must always land inside the uploads directory, even
	 * when guid.name carries traversal segments. sideload_media() reduces the
	 * caller-supplied name to a sanitized basename before handing it to core, so
	 * a crafted name can neither escape wp_upload_dir() nor keep its traversal
	 * path in the stored file.
	 */
	public function test_sideload_media_confines_traversal_name_to_uploads() {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$tmp_file = wp_tempnam();
		copy( static::$image_path, $tmp_file );

		// A unique basename keeps wp_unique_filename() from appending a "-1"
		// collision suffix if the test runs alongside others sharing the uploads
		// directory, so the assertion below stays about traversal, not naming.
		$safe_name     = 'evil-' . uniqid() . '.jpg';
		$endpoint      = new WPCOM_REST_API_V2_Endpoint_External_Media();
		$attachment_id = $endpoint->sideload_media( '../../../../' . $safe_name, $tmp_file );

		if ( is_wp_error( $attachment_id ) && file_exists( $tmp_file ) ) {
			unlink( $tmp_file );
		}
		$this->assertNotWPError( $attachment_id );

		$attached_file = (string) realpath( get_attached_file( $attachment_id ) );
		$uploads_path  = realpath( wp_upload_dir()['path'] );

		// The stored file is inside the uploads directory and its name is reduced
		// to the bare basename, with the traversal prefix stripped.
		$this->assertStringStartsWith( $uploads_path, $attached_file );
		$this->assertStringNotContainsString( '..', $attached_file );
		$this->assertSame( $safe_name, basename( $attached_file ) );
	}

	/**
	 * Tests connection response for Google Photos.
	 */
	public function test_connection_google_photos() {
		add_filter( 'rest_pre_dispatch', array( $this, 'mock_wpcom_api_response_connection_google_photos' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/external-media/connection/google_photos' );
		$response = $this->server->dispatch( $request );
		$data     = json_decode( wp_remote_retrieve_body( $response->get_data() ) );

		$this->assertEquals( 'google_photos', $data->ID );
		$this->assertNotEmpty( $data->connect_URL ); //phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		remove_filter( 'rest_pre_dispatch', array( $this, 'mock_wpcom_api_response_connection_google_photos' ) );
	}

	/**
	 * Tests delete connection response for Google Photos.
	 */
	public function test_delete_connection_google_photos() {
		add_filter( 'rest_pre_dispatch', array( $this, 'mock_wpcom_api_response_delete_connection_google_photos' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::DELETE, '/wpcom/v2/external-media/connection/google_photos' );
		$response = $this->server->dispatch( $request );
		$data     = json_decode( wp_remote_retrieve_body( $response->get_data() ) );

		$this->assertNotEmpty( $data->ID );
		$this->assertTrue( $data->deleted );

		remove_filter( 'rest_pre_dispatch', array( $this, 'mock_wpcom_api_response_delete_connection_google_photos' ) );
	}

	/**
	 * Tests delete connection response for Google Photos.
	 *
	 * @dataProvider google_photos_request_methods
	 * @param string $method Request method.
	 */
	#[DataProvider( 'google_photos_request_methods' )]
	public function test_connection_google_photos_with_error( $method ) {
		add_filter( 'rest_pre_dispatch', array( $this, 'mock_wpcom_api_external_media_connection_response_with_error' ), 10, 3 );

		$request  = new WP_REST_Request( $method, '/wpcom/v2/external-media/connection/google_photos' );
		$response = $this->server->dispatch( $request );
		$data     = json_decode( wp_remote_retrieve_body( $response->get_data() ) );

		$this->assertNotEmpty( $data->code );
		$this->assertSame( 'rest_not_found', $data->code );
		$this->assertSame( 'Connection with this ID not found.', $data->message );
		$this->assertObjectHasProperty( 'status', $data->data );
		$this->assertSame( 404, $data->data->status );

		remove_filter( 'rest_pre_dispatch', array( $this, 'mock_wpcom_api_external_media_connection_response_with_error' ) );
	}

	/**
	 * Data provider for test_connection_google_photos_with_error
	 *
	 * @return array[]
	 */
	public static function google_photos_request_methods() {
		return array(
			'GET'    => array( Requests::GET ),
			'DELETE' => array( Requests::DELETE ),
		);
	}

	/**
	 * Mock the user token.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$user_id => 'pretend_this_is_valid.secret.' . static::$user_id,
			),
		);
	}

	/**
	 * Validate the "list" Jetpack API request for Pexels and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_list_pexels( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/meta/external-media/pexels', $url );

		return array(
			'headers'  => array(
				'Allow' => 'GET',
			),
			'body'     => '{"found":0,"media":[],"meta":{"next_page":false}}',
			'status'   => 200,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "list" Jetpack API request for Google Photos and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_list_google_photos_unauthenticated( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v2/meta/external-media/google_photos', $url );

		return array(
			'headers'  => array(
				'Allow' => 'GET',
			),
			'body'     => '{"code":"authorization_required","message":"You are not connected to that service.","data":{"status":403}}',
			'status'   => 403,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "copy" Jetpack API request for Pexels and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_image_data( $response, $args, $url ) {
		$this->assertEquals( self::IMAGE_URL, $url );

		return array(
			'headers'  => array(
				'Allow' => 'GET',
			),
			'status'   => 200,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "connection" Jetpack API request for Google Photos and mock the response.
	 *
	 * @param mixed           $result  Response to replace the requested version with. Can be anything
	 *                                 a normal endpoint can return, or null to not hijack the request.
	 * @param WP_REST_Server  $server  Server instance.
	 * @param WP_REST_Request $request Request used to generate the response.
	 * @return array
	 */
	public function mock_wpcom_api_response_connection_google_photos( $result, $server, $request ) {
		$this->assertEquals( WP_REST_Server::READABLE, $request->get_method() );
		$this->assertStringEndsWith( '/external-media/connection/google_photos', $request->get_route() );

		return array(
			'headers'  => array(
				'Allow' => 'GET',
			),
			'body'     => '{"ID":"google_photos","label":"Google Photos","type":"other","description":"Access photos in your Google Account for use in posts and pages","genericon":{"class":"googleplus-alt","unicode":"\\f218"},"icon":"http:\/\/i.wordpress.com\/wp-content\/lib\/external-media-service\/icon\/google-photos-2x.png","connect_URL":"https:\/\/public-api.wordpress.com\/connect\/?action=request&kr_nonce=0&nonce=0&for=connect&service=google_photos&kr_blog_nonce=0&magic=keyring&blog=0","multiple_external_user_ID_support":false,"external_users_only":false,"jetpack_support":true}',
			'status'   => 200,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "delete connection" Jetpack API request for Google Photos and mock the response.
	 *
	 * @param mixed           $result  Response to replace the requested version with. Can be anything
	 *                                 a normal endpoint can return, or null to not hijack the request.
	 * @param WP_REST_Server  $server  Server instance.
	 * @param WP_REST_Request $request Request used to generate the response.
	 * @return array
	 */
	public function mock_wpcom_api_response_delete_connection_google_photos( $result, $server, $request ) {
		$this->assertEquals( WP_REST_Server::DELETABLE, $request->get_method() );
		$this->assertStringEndsWith( '/external-media/connection/google_photos', $request->get_route() );

		return array(
			'headers'  => array(
				'Allow' => 'GET, DELETE',
			),
			'body'     => '{"ID":1234,"deleted":true}',
			'status'   => 200,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Validate the "delete connection" Jetpack API request for Google Photos and mock the response.
	 *
	 * @param mixed           $result  Response to replace the requested version with. Can be anything
	 *                                 a normal endpoint can return, or null to not hijack the request.
	 * @param WP_REST_Server  $server  Server instance.
	 * @param WP_REST_Request $request Request used to generate the response.
	 * @return array
	 */
	public function mock_wpcom_api_external_media_connection_response_with_error( $result, $server, $request ) {
		$this->assertStringEndsWith( '/external-media/connection/google_photos', $request->get_route() );

		return array(
			'headers'  => array(
				'Allow' => 'GET, DELETE',
			),
			'body'     => '{"code":"rest_not_found","message":"Connection with this ID not found.","data":{"status":404}}',
			'status'   => 500,
			'response' => array(
				'code'    => 500,
				'message' => 'Server Error',
			),
		);
	}

	/**
	 * Copies file contents into temp file.
	 *
	 * @param array $file File information.
	 * @return mixed
	 */
	public function copy_image( $file ) {
		copy( static::$image_path, $file['tmp_name'] );

		// Stream wrappers like Patchwork probably resulted in an incorrect stat
		// cache entry for the file. So clear it.
		clearstatcache();

		return $file;
	}

	/**
	 * Returns an array of allowed image extensions.
	 *
	 * @return array
	 */
	public function mock_extensions() {
		return array(
			'ext'             => 'jpg',
			'type'            => 'image/jpeg',
			'proper_filename' => basename( static::$image_path ),
		);
	}
}

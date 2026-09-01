<?php
/**
 * Unit tests for the Jetpack_Backup class.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class Jetpack_Backup_Test extends TestCase {

	/**
	 * Captured request URL from the most recent mocked HTTP request.
	 *
	 * @var string
	 */
	private $captured_url = '';

	/**
	 * Body for the next mocked product-catalogue response. Null means
	 * "the well-formed catalogue".
	 *
	 * @var string|null
	 */
	private $catalogue_body = null;

	/**
	 * Status for the next mocked product-catalogue response.
	 *
	 * @var int|string
	 */
	private $catalogue_status = 200;

	/**
	 * Status for the next mocked WordPress.com response.
	 *
	 * @var int|string
	 */
	private $wpcom_status = 200;

	/**
	 * Raw body for the next mocked WordPress.com response.
	 *
	 * An empty object by default, which is all the route tests above need —
	 * they assert on the status, not on what came back. A test that has to
	 * reach past the status guard and read the payload sets its own.
	 *
	 * @var string
	 */
	private $wpcom_body = '{}';

	/**
	 * How many times a route reached the mocked transport.
	 *
	 * @var int
	 */
	private $http_requests = 0;

	/**
	 * Undo the request mocking. Done here rather than after each assertion so
	 * that a failing assertion cannot leak a filter into the next test.
	 */
	protected function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ) );
		remove_filter( 'pre_http_request', array( $this, 'mock_wpcom_unreachable' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ) );
		wp_set_current_user( 0 );

		$this->wpcom_status  = 200;
		$this->wpcom_body    = '{}';
		$this->http_requests = 0;

		parent::tearDown();
	}

	/**
	 * A WordPress.com blip must not read as an empty success. These routes used
	 * to `return null`, which WordPress serves as HTTP 200 with a `null` body —
	 * so `apiFetch` resolved and no consumer's failure path ever ran.
	 *
	 * Asserted through the REST server rather than against the callback's return
	 * value, because the served status is the thing that was wrong.
	 *
	 * 503 and not 500: 500 is also what the no-status fallback produces, so
	 * asserting it here would pass whether or not the upstream status was
	 * forwarded at all.
	 *
	 * @param string $route       The registered REST route.
	 * @param string $http_method The route's HTTP method.
	 * @dataProvider provide_wpcom_backed_route_requests
	 */
	#[DataProvider( 'provide_wpcom_backed_route_requests' )]
	public function test_route_is_served_with_the_upstream_status( $route, $http_method ) {
		$this->sign_in_as_connected_admin();
		$this->wpcom_status = 503;
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ) );

		rest_get_server();
		Jetpack_Backup::register_rest_routes();

		$response = rest_do_request( new WP_REST_Request( $http_method, $route ) );

		$this->assertTrue( $response->is_error(), $route );
		$this->assertSame( 503, $response->get_status(), $route );
	}

	/**
	 * The callback reports the upstream status, so the REST layer has something
	 * to serve other than a generic 500.
	 *
	 * @param string $callback Name of the route callback.
	 * @dataProvider provide_wpcom_backed_route_callbacks
	 */
	#[DataProvider( 'provide_wpcom_backed_route_callbacks' )]
	public function test_route_forwards_a_non_200( $callback ) {
		$this->sign_in_as_connected_admin();
		$this->wpcom_status = 503;
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ) );

		$result = call_user_func( array( Jetpack_Backup::class, $callback ) );

		$this->assertInstanceOf( WP_Error::class, $result, $callback );
		$this->assertSame( 'failed_to_fetch_data', $result->get_error_code(), $callback );
		$this->assertSame( 503, $result->get_error_data()['status'], $callback );
	}

	/**
	 * A transport failure has no status at all. Reporting the 0 that casting
	 * produces would leave the REST layer emitting an invalid status line.
	 *
	 * The request count is asserted because a 500 alone proves nothing here: a
	 * request that is never signed is refused before the wire and reports a
	 * status of 0 too, so this would pass with neither the sign-in nor the
	 * transport mock in place.
	 *
	 * @param string $callback Name of the route callback.
	 * @dataProvider provide_wpcom_backed_route_callbacks
	 */
	#[DataProvider( 'provide_wpcom_backed_route_callbacks' )]
	public function test_route_reports_a_transport_failure_as_500( $callback ) {
		$this->sign_in_as_connected_admin();
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_unreachable' ) );

		$result = call_user_func( array( Jetpack_Backup::class, $callback ) );

		$this->assertSame( 1, $this->http_requests, $callback );
		$this->assertInstanceOf( WP_Error::class, $result, $callback );
		$this->assertSame( 500, $result->get_error_data()['status'], $callback );
	}

	/**
	 * A good answer still comes back as a response.
	 *
	 * The status is mocked as the *string* `'200'` deliberately: the transport
	 * may report it that way, and a strict comparison against the integer 200
	 * would send a perfectly good answer down the failure path.
	 *
	 * @param string $callback Name of the route callback.
	 * @dataProvider provide_wpcom_backed_route_callbacks
	 */
	#[DataProvider( 'provide_wpcom_backed_route_callbacks' )]
	public function test_route_returns_a_response_on_a_string_status_200( $callback ) {
		$this->sign_in_as_connected_admin();
		$this->wpcom_status = '200';
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ) );

		$result = call_user_func( array( Jetpack_Backup::class, $callback ) );

		$this->assertInstanceOf( WP_REST_Response::class, $result, $callback );
		$this->assertSame( array(), $result->get_data(), $callback );
	}

	/**
	 * The seven unconditionally-registered routes that answer out of
	 * WordPress.com, as route path => array( callback, HTTP method ).
	 *
	 * One list, two providers, so that adding a route here covers it
	 * everywhere.
	 *
	 * @return array[]
	 */
	private static function wpcom_backed_routes() {
		return array(
			'/jetpack/v4/backups'              => array( 'get_recent_backups', 'GET' ),
			'/jetpack/v4/backup-capabilities'  => array( 'get_backup_capabilities', 'GET' ),
			'/jetpack/v4/restores'             => array( 'get_recent_restores', 'GET' ),
			'/jetpack/v4/site/backup/size'     => array( 'get_site_backup_size', 'GET' ),
			'/jetpack/v4/site/backup/policies' => array( 'get_site_backup_policies', 'GET' ),
			'/jetpack/v4/site/backup/enqueue'  => array( 'enqueue_backup', 'POST' ),
			'/jetpack/v4/site/backup/schedule' => array( 'get_site_backup_schedule_time', 'GET' ),
		);
	}

	/**
	 * The route callbacks, keyed by route so a failure names the endpoint.
	 *
	 * @return array[]
	 */
	public static function provide_wpcom_backed_route_callbacks() {
		$sets = array();

		foreach ( self::wpcom_backed_routes() as $route => $spec ) {
			$sets[ $route ] = array( $spec[0] );
		}

		return $sets;
	}

	/**
	 * The same routes as REST requests: route path and HTTP method.
	 *
	 * @return array[]
	 */
	public static function provide_wpcom_backed_route_requests() {
		$sets = array();

		foreach ( self::wpcom_backed_routes() as $route => $spec ) {
			$sets[ $route ] = array( $route, $spec[1] );
		}

		return $sets;
	}

	public function test_list_backup_events_returns_null_on_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::list_backup_events();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );
	}

	public function test_list_backup_events_returns_null_on_non_200() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_server_error' ) );

		$result = Jetpack_Backup::list_backup_events();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_server_error' ) );
	}

	/**
	 * A success code reported as a string still lists the events.
	 *
	 * `list_backup_events()` is not one of the seven routes covered by the
	 * providers above — it answers no route of its own and is read by the
	 * `jetpack-backup/list-backup-events` ability, which flattens this
	 * `null` into an empty list through `unwrap_response()`. So an uncast
	 * `'200'` did not surface as an error anywhere: it told the caller the
	 * site has completed no backups, which is a claim rather than a failure.
	 */
	public function test_list_backup_events_reads_a_string_status_200() {
		$this->sign_in_as_connected_admin();
		$this->wpcom_status = '200';
		$this->wpcom_body   = '{"type":"OrderedCollection","totalItems":1}';
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ) );

		$result = Jetpack_Backup::list_backup_events();

		$this->assertInstanceOf( WP_REST_Response::class, $result );
		$this->assertSame( 1, $result->get_data()['totalItems'] );
	}

	/**
	 * A success code reported as a string does not cost the site its plan.
	 *
	 * `get_rewind_state_from_wpcom()` is private; `has_backup_plan()` is the
	 * door, and it answers false for the `WP_Error` an uncast `'200'`
	 * produced — so a site that does have Backup was told it does not. That
	 * answer is acted on: it backs `GET /jetpack/v4/has-backup-plan` and the
	 * standalone-license upsell in `jetpack_check_user_licenses()`.
	 *
	 * The request count is asserted because that helper memoizes a
	 * *successful* fetch in a function static, which no test can reset. This
	 * is the only test in the suite that drives it to a success, so the
	 * static should still be empty when it runs — and if some later test
	 * changes that, this assertion says so rather than passing on a cached
	 * answer that never touched the code under test.
	 */
	public function test_has_backup_plan_reads_a_string_status_200() {
		$this->sign_in_as_connected_admin();
		$this->wpcom_status = '200';
		$this->wpcom_body   = '{"state":"active"}';
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_response' ) );

		$result = Jetpack_Backup::has_backup_plan();

		$this->assertSame( 1, $this->http_requests );
		$this->assertTrue( $result );
	}

	public function test_list_backup_events_returns_response_and_pins_backup_actions_on_success() {
		$this->captured_url = '';

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'backup_events_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10, 2 );
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_activity_collection' ), 10, 3 );

		// Caller-supplied `action` must be overridden with the curated backup list.
		$result = Jetpack_Backup::list_backup_events(
			array(
				'action' => 'should_be_overridden',
				'number' => 5,
			)
		);

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_activity_collection' ) );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ) );
		wp_set_current_user( 0 );

		$this->assertInstanceOf( WP_REST_Response::class, $result );
		$data = $result->get_data();
		$this->assertSame( 'OrderedCollection', $data['type'] );
		$this->assertSame( 1, $data['totalItems'] );

		$this->assertStringContainsString( 'backup_complete_full', $this->captured_url );
		$this->assertStringNotContainsString( 'should_be_overridden', $this->captured_url );
		$this->assertStringContainsString( 'number=5', urldecode( $this->captured_url ) );
	}

	/**
	 * A 200 carrying the promoted product returns it.
	 */
	public function test_promoted_product_info_returns_the_promoted_product() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ), 10, 3 );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ) );

		$this->assertIsObject( $result );
		$this->assertSame( 539.4, $result->cost );
		$this->assertSame( 'BRL', $result->currency_code );
	}

	/**
	 * The transport may report the status as a numeric string, which a
	 * strict comparison against the integer 200 sends down the failure
	 * path — reporting a perfectly good catalogue as unreachable.
	 */
	public function test_promoted_product_info_treats_a_string_status_as_its_number() {
		$this->catalogue_status = '200';
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ), 10, 3 );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ) );

		$this->assertIsObject( $result );
		$this->assertSame( 'BRL', $result->currency_code );
	}

	/**
	 * A 200 whose body will not decode is refused rather than read
	 * through. `json_decode` returns null there, and reading a property
	 * off it warns and evaluates to null — so the route answered 200 with
	 * `null`, which no caller can tell from a price it could not parse.
	 *
	 * @param string $label Human-readable case name.
	 * @param string $body  The response body.
	 * @dataProvider provide_unreadable_catalogues
	 */
	#[DataProvider( 'provide_unreadable_catalogues' )]
	public function test_promoted_product_info_refuses_an_unreadable_catalogue( $label, $body ) {
		$this->catalogue_body = $body;
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ), 10, 3 );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ) );

		$this->assertInstanceOf( WP_Error::class, $result, $label );
		$this->assertSame( 'promoted_product_unreadable', $result->get_error_code(), $label );
		$this->assertSame( 500, $result->get_error_data()['status'], $label );
	}

	/**
	 * Bodies a 200 can carry that hold no promoted product.
	 *
	 * The absent-slug cases are not hypothetical: the slug is a constant
	 * here but a catalogue entry upstream, so retiring it there produces
	 * exactly this — a 200, a well-formed catalogue, and no key.
	 *
	 * @return array[]
	 */
	public static function provide_unreadable_catalogues() {
		return array(
			array( 'an empty body', '' ),
			array( 'a gateway HTML page', '<html><body>502</body></html>' ),
			array( 'a truncated document', '{"jetpack_backup_t1_yearly":' ),
			array( 'JSON null', 'null' ),
			array( 'a JSON list', '[]' ),
			array( 'a catalogue without the promoted slug', '{"jetpack_scan":{"cost":10}}' ),
			array( 'the promoted slug set to null', '{"jetpack_backup_t1_yearly":null}' ),
		);
	}

	/**
	 * A non-200 is reported with the upstream status, not a generic one.
	 *
	 * 403 and not 500 deliberately. 500 is also what the no-status
	 * fallback produces, so asserting it here would pass whether or not
	 * the status was forwarded at all — and would leave this testing the
	 * same thing as the transport-failure case below.
	 */
	public function test_promoted_product_info_forwards_a_non_200() {
		$this->catalogue_status = 403;
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ), 10, 3 );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_product_catalogue' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'failed_to_fetch_data', $result->get_error_code() );
		$this->assertSame( 403, $result->get_error_data()['status'] );
	}

	/**
	 * A transport failure has no status at all. Reporting the 0 that
	 * casting produces leaves the REST layer with no status to serve.
	 */
	public function test_promoted_product_info_reports_a_transport_failure_as_500() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::get_backup_promoted_product_info();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 500, $result->get_error_data()['status'] );
	}

	/**
	 * Mock the product catalogue endpoint.
	 *
	 * @param false  $preempt     Short-circuit value (unused).
	 * @param array  $parsed_args Request args (unused).
	 * @param string $url         The request URL.
	 * @return array
	 */
	public function mock_request_as_product_catalogue( $preempt, $parsed_args, $url ) {
		$this->captured_url = (string) $url;

		$body = $this->catalogue_body;

		if ( null === $body ) {
			$body = wp_json_encode(
				array(
					'jetpack_backup_t1_yearly' => array(
						'cost'               => 539.4,
						'currency_code'      => 'BRL',
						'introductory_offer' => array(
							'interval_unit'     => 'year',
							'interval_count'    => 1,
							'cost_per_interval' => 275.4,
						),
					),
				),
				JSON_UNESCAPED_SLASHES
			);
		}

		return array(
			'response' => array( 'code' => $this->catalogue_status ),
			'body'     => $body,
		);
	}

	/**
	 * Sign in an administrator and mock the connection tokens, so that both the
	 * as-blog and as-user wpcom requests are signed and actually reach the
	 * `pre_http_request` mock rather than being refused before the wire.
	 *
	 * WorDBless does not reset the database between tests in this class, so the
	 * user is created once and reused.
	 */
	private function sign_in_as_connected_admin() {
		// `Client::validate_args_for_wpcom_json_api_request()` reads
		// `JETPACK__WPCOM_JSON_API_BASE` before `build_signed_request()` installs
		// the filter that supplies its default, so without this the first signed
		// request of the process is built against a host-less URL and refused
		// before the wire — making these tests depend on execution order. Plugins
		// prime the constants at bootstrap; tests have to do it themselves.
		Connection_Utils::init_default_constants();

		$user = get_user_by( 'login', 'backup_routes_admin' );

		if ( $user ) {
			$user_id = $user->ID;
		} else {
			$user_id = wp_insert_user(
				array(
					'user_login' => 'backup_routes_admin',
					'user_pass'  => 'pass',
					'role'       => 'administrator',
				)
			);
		}

		wp_set_current_user( $user_id );
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_connection_options' ), 10, 2 );
	}

	/**
	 * Mock a WordPress.com request with the configured status and an empty JSON
	 * object, so the status is the only thing under test.
	 *
	 * @return array
	 */
	public function mock_wpcom_response() {
		++$this->http_requests;

		return array(
			'response' => array( 'code' => $this->wpcom_status ),
			'body'     => $this->wpcom_body,
		);
	}

	/**
	 * Mock a request that leaves this site but never reaches WordPress.com.
	 *
	 * Kept separate from `mock_request_as_wp_error()` so the route tests can
	 * count how far the request got.
	 *
	 * @return WP_Error
	 */
	public function mock_wpcom_unreachable() {
		++$this->http_requests;

		return new WP_Error( 'http_request_failed', 'The request failed.' );
	}

	/**
	 * Mock a Jetpack user connection so wpcom-as-user requests are signed.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_jetpack_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'test.blogtoken';
			case 'id':
				return '999';
			case 'user_tokens':
				$user_id = get_current_user_id();
				if ( $user_id ) {
					return array(
						$user_id => sprintf( 'token%d.secret%d.%d', $user_id, $user_id, $user_id ),
					);
				}
		}

		return $value;
	}

	/**
	 * Mock the HTTP request to return a WP_Error.
	 *
	 * @return WP_Error
	 */
	public function mock_request_as_wp_error() {
		return new WP_Error( 'http_request_failed', 'The request failed.' );
	}

	/**
	 * Mock the HTTP request to return a 500 response.
	 *
	 * @return array
	 */
	public function mock_request_as_server_error() {
		return array(
			'response' => array( 'code' => 500 ),
			'body'     => '',
		);
	}

	/**
	 * Mock the HTTP request to return a 200 ActivityStreams collection and
	 * capture the requested URL.
	 *
	 * @param false  $preempt     Short-circuit value (unused).
	 * @param array  $parsed_args Request args (unused).
	 * @param string $url         The request URL.
	 * @return array
	 */
	public function mock_request_as_activity_collection( $preempt, $parsed_args, $url ) {
		$this->captured_url = (string) $url;

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'type'         => 'OrderedCollection',
					'totalItems'   => 1,
					'orderedItems' => array(
						array(
							'published'     => '2026-05-15T00:00:00+00:00',
							'rewind_id'     => '1747267200.123456',
							'is_rewindable' => true,
							'name'          => 'backup_complete_full',
							'status'        => 'success',
							'summary'       => 'Backup complete',
						),
					),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
	}

	/**
	 * The dismissal route refuses a reason `Jetpack_Options` cannot store.
	 *
	 * A reason outside `Jetpack_Options`' allowlist reaches a `trigger_error()`
	 * and is stored nowhere, so without the enum the route answers 200 for a
	 * dismissal it did not record — and prints a warning ahead of the JSON.
	 *
	 * @param string $option_name The reason to send.
	 * @dataProvider provide_unstorable_review_reasons
	 */
	#[DataProvider( 'provide_unstorable_review_reasons' )]
	public function test_dismissal_route_refuses_an_unstorable_reason( $option_name ) {
		$this->sign_in_as_connected_admin();

		rest_get_server();
		Jetpack_Backup::register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/dismissed-review-request' );
		$request->set_body_params(
			array(
				'option_name'    => $option_name,
				'should_dismiss' => false,
			)
		);
		$response = rest_do_request( $request );

		$this->assertSame( 400, $response->get_status(), $option_name );
	}

	/**
	 * Reasons the route must refuse.
	 *
	 * @return array
	 */
	public static function provide_unstorable_review_reasons() {
		return array(
			// The shape a third prompt would arrive in if someone added one
			// without also adding the option name upstream.
			'a reason nobody registered' => array( 'scan' ),
			'empty'                      => array( '' ),
			// Not an injection risk — the value is concatenated into an
			// option name that is then allowlisted — but it has no business
			// reaching that concatenation at all.
			'a path'                     => array( '../../etc/passwd' ),
		);
	}

	/**
	 * Both reasons the dashboard actually sends are accepted, and an
	 * un-dismissed prompt reads as `false`.
	 *
	 * The client treats anything but a literal `false` as dismissed.
	 *
	 * @param string $option_name The reason to send.
	 * @dataProvider provide_review_reasons
	 */
	#[DataProvider( 'provide_review_reasons' )]
	public function test_dismissal_route_accepts_the_reasons_the_dashboard_sends( $option_name ) {
		$this->sign_in_as_connected_admin();

		rest_get_server();
		Jetpack_Backup::register_rest_routes();

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/site/dismissed-review-request' );
		$request->set_body_params(
			array(
				'option_name'    => $option_name,
				'should_dismiss' => false,
			)
		);
		$response = rest_do_request( $request );

		$this->assertSame( 200, $response->get_status(), $option_name );
		$this->assertFalse( $response->get_data(), $option_name );
	}

	/**
	 * The two reasons the review prompt can carry.
	 *
	 * @return array
	 */
	public static function provide_review_reasons() {
		return array(
			'restore' => array( 'restore' ),
			'backups' => array( 'backups' ),
		);
	}
}

<?php
/**
 * Tests for /wpcom/v2/subscribers/* proxy endpoints.
 *
 * @covers WPCOM_REST_API_V2_Endpoint_Subscribers_List
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Subscribers_List_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Subscribers_List
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Subscribers_List::class )]
class WPCOM_REST_API_V2_Endpoint_Subscribers_List_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock admin user ID.
	 *
	 * @var int
	 */
	private static $admin_id = 0;

	/**
	 * Mock author user ID.
	 *
	 * @var int
	 */
	private static $author_id = 0;

	/**
	 * Mock blog ID.
	 *
	 * @var int
	 */
	private static $blog_id = 123;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	/**
	 * Setup the environment for a test. Default to "modernization filter on" so most tests can
	 * exercise the registered routes; the dedicated gate test toggles it off and rebuilds the
	 * REST server.
	 */
	public function set_up() {
		wp_set_current_user( static::$admin_id );

		add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_true' );
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		add_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );

		// Manually load the class under test — `wpcom_rest_api_v2_load_plugin()` only runs on
		// `plugins_loaded`, which has already passed by the time the test harness boots.
		// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
		new WPCOM_REST_API_V2_Endpoint_Subscribers_List();

		parent::set_up();
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_true' );
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		remove_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );

		parent::tear_down();
	}

	/**
	 * Mock the Jetpack private options so `Connection_Manager` reports the test admin as
	 * connected.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$admin_id => 'pretend_this_is_valid.secret.' . static::$admin_id,
			),
		);
	}

	/**
	 * Mock the Jetpack public options so the proxy can resolve the blog id.
	 *
	 * @return array
	 */
	public function mock_jetpack_options() {
		return array(
			'id' => static::$blog_id,
		);
	}

	/**
	 * With the modernization filter disabled, none of the routes are registered — callers see a
	 * standard `rest_no_route` 404 instead of a live proxy.
	 */
	public function test_routes_not_registered_when_modernization_disabled() {
		remove_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_true' );
		add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' );
		$GLOBALS['wp_rest_server'] = new Spy_REST_Server();
		// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
		new WPCOM_REST_API_V2_Endpoint_Subscribers_List();
		do_action( 'rest_api_init' );
		$this->server = $GLOBALS['wp_rest_server'];

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/subscribers/list' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'rest_no_route', $response->get_data()['code'] );

		remove_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' );
	}

	/**
	 * Anonymous requests get a 401 from the shared `permission_check`.
	 */
	public function test_list_rejects_anonymous() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/subscribers/list' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'authorization_required', $response->get_data()['code'] );
	}

	/**
	 * Logged-in users without `manage_options` get a 403.
	 */
	public function test_list_rejects_insufficient_permissions() {
		wp_set_current_user( static::$author_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/subscribers/list' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'authorization_required', $response->get_data()['code'] );
	}

	/**
	 * `/subscribers/add` rejects payloads that don't yield at least one valid email after
	 * `sanitize_email` + `is_email`.
	 */
	public function test_add_rejects_payload_with_no_valid_emails() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/subscribers/add' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array( 'emails' => array( 'not-an-email', 'still@invalid' ) ),
				JSON_UNESCAPED_SLASHES
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'subscribers_add_no_valid_emails', $response->get_data()['code'] );
	}

	/**
	 * The schema's `validate_callback` rejects an empty `emails` array up-front, so the request
	 * never reaches the handler.
	 */
	public function test_add_rejects_empty_emails_array() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/subscribers/add' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'emails' => array() ), JSON_UNESCAPED_SLASHES ) );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * `/subscribers/remove` rejects payloads with no identifiers at all — protects WP.com from
	 * receiving a no-op cascade.
	 */
	public function test_remove_rejects_payload_with_no_identifiers() {
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/subscribers/remove' );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'subscribers_remove_invalid', $response->get_data()['code'] );
	}

	/**
	 * `/subscribers/individual` requires either a subscription_id or a user_id — without both,
	 * there's nothing to fetch.
	 */
	public function test_individual_rejects_missing_ids() {
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/subscribers/individual' );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'subscriber_individual_missing_id', $response->get_data()['code'] );
	}

	/**
	 * Same contract on `/subscribers/stats`.
	 */
	public function test_stats_rejects_missing_ids() {
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/subscribers/stats' );

		$response = $this->server->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'subscriber_stats_missing_id', $response->get_data()['code'] );
	}

	/**
	 * `get_wpcom_error_message()` digs the most specific reason out of a Memberships API body:
	 * the nested `error.message` the comp endpoints use, then a top-level `message`, then a string
	 * `error`, and finally the supplied default. This is what lets the comp/remove-comp endpoints
	 * surface "User has already been comped this plan" instead of a generic failure.
	 *
	 * @param string $expected Expected message.
	 * @param mixed  $body     Decoded response body.
	 * @param string $default  Fallback message.
	 * @dataProvider provider_wpcom_error_messages
	 */
	#[DataProvider( 'provider_wpcom_error_messages' )]
	public function test_get_wpcom_error_message( $expected, $body, $default ) {
		$endpoint = new WPCOM_REST_API_V2_Endpoint_Subscribers_List();
		$method   = new ReflectionMethod( WPCOM_REST_API_V2_Endpoint_Subscribers_List::class, 'get_wpcom_error_message' );
		// setAccessible() is required on PHP < 8.1 to invoke a private method, but is a deprecated
		// no-op from 8.5 — only call it where it's actually needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$this->assertSame( $expected, $method->invoke( $endpoint, $body, $default ) );
	}

	/**
	 * Data for {@see test_get_wpcom_error_message()}.
	 *
	 * @return array<string, array{0: string, 1: mixed, 2: string}>
	 */
	public static function provider_wpcom_error_messages() {
		$default = 'Could not comp the subscription.';

		return array(
			'nested error.message (already-comped case)' => array(
				'User has already been comped this plan',
				array(
					'error' => array(
						'code'    => 'validation_error',
						'message' => 'User has already been comped this plan',
					),
				),
				$default,
			),
			'nested error.message wins over top-level message' => array(
				'Nested wins',
				array(
					'message' => 'Top level',
					'error'   => array( 'message' => 'Nested wins' ),
				),
				$default,
			),
			'top-level message when no nested error.message' => array(
				'Top level reason',
				array( 'message' => 'Top level reason' ),
				$default,
			),
			'string error'                               => array(
				'Plain string error',
				array( 'error' => 'Plain string error' ),
				$default,
			),
			'default when error.message is not a string' => array(
				$default,
				array( 'error' => array( 'message' => array( 'unexpected' ) ) ),
				$default,
			),
			'default when body has no usable message'    => array(
				$default,
				array( 'error' => array( 'code' => 'validation_error' ) ),
				$default,
			),
			'default when body is not an array'          => array(
				$default,
				null,
				$default,
			),
		);
	}
}

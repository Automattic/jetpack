<?php
/**
 * Class for REST API endpoints testing.
 *
 * @since 4.4.0
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Status\Cache as StatusCache;

require_once __DIR__ . '/../../../../modules/widgets/milestone.php';

/**
 * phpcs:disable PEAR.NamingConventions.ValidClassName.Invalid
 */
class WP_Test_Jetpack_REST_API_endpoints extends WP_UnitTestCase {
	// phpcs:enable PEAR.NamingConventions.ValidClassName.Invalid

	/**
	 * Used to store an instance of the WP_REST_Server.
	 *
	 * @since 4.4.0
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Setup environment for REST API endpoints test.
	 *
	 * @since 4.4.0
	 */
	public function set_up() {

		parent::set_up();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean environment for REST API endpoints test.
	 *
	 * @since 4.4.0
	 */
	public function tear_down() {
		parent::tear_down();

		global $wp_rest_server;
		$wp_rest_server = null;
	}

	/**
	 * Loads the REST API endpoints to test their methods directly.
	 *
	 * @since 4.4.0
	 */
	protected function load_rest_endpoints_direct() {
		require_once __DIR__ . '/../../../../_inc/lib/class.core-rest-api-endpoints.php';
	}

	/**
	 * Get Jetpack connection status.
	 *
	 * @since 4.4.0
	 *
	 * @return array
	 */
	protected function get_jetpack_connection_status() {
		$status = REST_Connector::connection_status();
		return isset( $status->data ) ? $status->data : array();
	}

	/**
	 * Create and get a user using WP factory.
	 *
	 * @since 4.4.0
	 *
	 * @param string $role
	 *
	 * @return WP_User
	 */
	protected function create_and_get_user( $role = '' ) {
		return self::factory()->user->create_and_get(
			array(
				'role' => empty( $role ) ? 'subscriber' : $role,
			)
		);
	}

	/**
	 * Creates a WP_REST_Request and returns it.
	 *
	 * @since 4.4.0
	 *
	 * @param string $route       REST API path to be appended to /jetpack/v4/.
	 * @param array  $json_params When present, parameters are added to request in JSON format.
	 * @param string $method      Request method to use, GET or POST.
	 * @param array  $params      Parameters to add to endpoint.
	 *
	 * @return WP_REST_Response
	 */
	protected function create_and_get_request( $route = '', $json_params = array(), $method = 'GET', $params = array() ) {
		$request = new WP_REST_Request( $method, "/jetpack/v4/$route" );

		if ( 'GET' !== $method && ! empty( $json_params ) ) {
			$request->set_header( 'content-type', 'application/json' );
		}
		if ( ! empty( $json_params ) ) {
			$request->set_body( json_encode( $json_params ) );
		}
		if ( ! empty( $params ) && is_array( $params ) ) {
			foreach ( $params as $key => $value ) {
				$request->set_param( $key, $value );
			}
		}
		return $this->server->dispatch( $request );
	}

	/**
	 * Used to simulate a successful response to any XML-RPC request.
	 * Should be hooked on the `pre_http_resquest` filter.
	 *
	 * @param false  $preempt A preemptive return value of an HTTP request.
	 * @param array  $args    HTTP request arguments.
	 * @param string $url     The request URL.
	 *
	 * @return WP_REST_Response
	 */
	public function mock_xmlrpc_success( $preempt, $args, $url ) {
		if ( strpos( $url, 'https://jetpack.wordpress.com/xmlrpc.php' ) !== false ) {
			$response = array();

			$response['body'] = '
				<methodResponse>
					<params>
						<param>
							<value>1</value>
						</param>
					</params>
				</methodResponse>
			';

			$response['response']['code'] = 200;
			return $response;
		}

		return $preempt;
	}

	/**
	 * Check response status code.
	 *
	 * @since 4.4.0
	 *
	 * @param integer          $status
	 * @param WP_REST_Response $response
	 */
	protected function assertResponseStatus( $status, $response ) {
		$this->assertEquals( $status, $response->get_status() );
	}

	/**
	 * Check response data.
	 *
	 * @since 4.4.0
	 *
	 * @param array            $data
	 * @param WP_REST_Response $response
	 */
	protected function assertResponseData( $data, $response ) {
		$response_data = $response->get_data();
		$tested_data   = array();
		foreach ( $data as $key => $value ) {
			if ( isset( $response_data[ $key ] ) ) {
				$tested_data[ $key ] = $response_data[ $key ];
			} else {
				$tested_data[ $key ] = null;
			}
		}
		$this->assertEquals( $data, $tested_data );
	}

	/**
	 * Test permission to see if users can view Jetpack admin screen.
	 *
	 * @since 4.4.0
	 */
	public function test_jetpack_admin_page_permission() {

		StatusCache::clear();
		$this->load_rest_endpoints_direct();

		// Current user doesn't have credentials, so checking permissions should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::view_admin_page_permission_check() );

		// Setup a new current user with specified capability
		$user = $this->create_and_get_user();

		// Add Jetpack capability
		$user->add_cap( 'jetpack_admin_page' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// User has capability so this should work this time
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::view_admin_page_permission_check() );

		// It should not work in Offline Mode.
		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		// Subscribers only have access to connect, which is not available in Dev Mode so this should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::view_admin_page_permission_check() );

		// Set user as admin
		$user->set_role( 'administrator' );

		// Reset user and setup globals again to reflect the role change.
		wp_set_current_user( 0 );
		wp_set_current_user( $user->ID );

		// Admins have acces to everything, to this should work
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::view_admin_page_permission_check() );

		remove_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();
	}

	/**
	 * Test permission to connect Jetpack site or link user.
	 *
	 * @since 4.4.0
	 */
	public function test_connection_permission() {

		StatusCache::clear();
		$this->load_rest_endpoints_direct();

		// Current user doesn't have credentials, so checking permissions should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );

		// Setup a new current user with specified capability
		$user = $this->create_and_get_user();

		// Add Jetpack capability
		$user->add_cap( 'jetpack_connect_user' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// It should not work for non-admin users, except if a connection owner exists.
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );

		// Set user as admin.
		$user->set_role( 'administrator' );
		// Reset user and setup globals again to reflect the role change.
		wp_set_current_user( 0 );
		wp_set_current_user( $user->ID );
		// User is admin and has capability so this should work this time.
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );

		// It should not work in Offline Mode.
		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );

		remove_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();
	}

	/**
	 * Test permission to disconnect Jetpack site.
	 *
	 * @since 4.4.0
	 */
	public function test_disconnection_permission() {

		$this->load_rest_endpoints_direct();

		// Current user doesn't have credentials, so checking permissions should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::disconnect_site_permission_callback() );

		$user = $this->create_and_get_user();

		// Add Jetpack capability
		$user->add_cap( 'jetpack_disconnect' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// User is not admin, so this should still fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check() );

		// Set user as admin
		$user->set_role( 'administrator' );

		// Reset user and setup globals again to reflect the role change.
		wp_set_current_user( 0 );
		wp_set_current_user( $user->ID );

		// User has capability so this should work this time
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::disconnect_site_permission_callback() );
	}

	/**
	 * Test permission to activate plugins.
	 *
	 * @since 4.4.0
	 */
	public function test_plugin_activation_permission() {

		$this->load_rest_endpoints_direct();

		// Current user doesn't have credentials, so checking permissions should fail
		$this->assertInstanceOf( 'WP_Error', REST_Connector::activate_plugins_permission_check() );

		$user = $this->create_and_get_user();

		// Add Jetpack capability
		$user->add_cap( 'jetpack_admin_page' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// Should fail because requires more capabilities
		$this->assertInstanceOf( 'WP_Error', REST_Connector::activate_plugins_permission_check() );

		// Add Jetpack capability
		$user->add_cap( 'activate_plugins' );
		// Multisite's require additional primitive capabilities.
		if ( is_multisite() ) {
			$user->add_cap( 'manage_network_plugins' );
		}

		// Reset current user and setup global variables to refresh the capability we just added.
		wp_set_current_user( 0 );
		wp_set_current_user( $user->ID );

		// User has capability so this should work this time
		$this->assertTrue( REST_Connector::activate_plugins_permission_check() );
	}

	/**
	 * Test permission to disconnect Jetpack site for a user that is connected.
	 *
	 * @since 4.4.0
	 */
	public function test_admin_user_unlink_permission() {

		$this->load_rest_endpoints_direct();

		// Current user doesn't have credentials, so checking permissions should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::unlink_user_permission_callback() );

		// Create an admin user.
		$user = $this->create_and_get_user( 'administrator' );

		// Add Jetpack capability
		$user->add_cap( 'jetpack_connect_user' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// This should still fail because user is not connected
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::unlink_user_permission_callback() );

		// Mock that it's connected
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

		// User has the capability and is connected so this should work this time
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::unlink_user_permission_callback() );
	}

	/**
	 * Test permission to manage and configure Jetpack modules.
	 *
	 * @since 4.4.0
	 */
	public function test_manage_configure_modules_permission() {

		// Current user doesn't have credentials, so checking permissions should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check() );
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::configure_modules_permission_check() );

		// Create a user
		$user = $this->create_and_get_user();

		// Add Jetpack capability
		$user->add_cap( 'jetpack_manage_modules' );
		$user->add_cap( 'jetpack_configure_modules' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// User is not admin, so this should still fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check() );
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::configure_modules_permission_check() );

		// Set user as admin
		$user->set_role( 'administrator' );

		// Reset user and setup globals again to reflect the role change.
		wp_set_current_user( 0 );
		wp_set_current_user( $user->ID );

		// User has the capability and is connected so this should work this time
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check() );
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::configure_modules_permission_check() );
	}

	/**
	 * Test information about connection status.
	 *
	 * @since 4.4.0
	 */
	public function test_jetpack_connection_status() {

		// Mock a connection
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asd.qwe.1' );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection' );

		// Success, connected site.
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData(
			array(
				'isActive'    => true,
				'isStaging'   => false,
				'offlineMode' => array(
					'isActive'        => false,
					'constant'        => false,
					'url'             => false,
					'filter'          => false,
					'wpLocalConstant' => false,
				),
			),
			$response
		);
	}

	/**
	 * Test information about connection status in dev mode.
	 *
	 * @since 4.4.0
	 */
	public function test_jetpack_connection_status_dev() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user();
		wp_set_current_user( $user->ID );

		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_true' );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection' );

		// Success, authenticated user and connected site
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData(
			array(
				'isActive'    => false,
				'isStaging'   => false,
				'offlineMode' => array(
					'isActive'        => true,
					'constant'        => false,
					'url'             => false,
					'filter'          => true,
					'wpLocalConstant' => false,
				),
			),
			$response
		);

		remove_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();
	}

	/**
	 * Test site disconnection with authenticated user and disconnected site
	 *
	 * @since 4.4.0
	 */
	public function test_disconnect_site_auth_param_notconnected() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection', array( 'isActive' => false ), 'POST' );

		// Fails because user is authenticated but site is not connected
		$this->assertResponseStatus( 400, $response );
		$this->assertResponseData( array( 'code' => 'disconnect_failed' ), $response );
	}

	/**
	 * Test site disconnection with authenticated user and connected site
	 *
	 * @since 4.4.0
	 */
	public function test_disconnect_site_auth_param_connected() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $user->ID );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asd.qwe.1' );
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection', array( 'isActive' => false ), 'POST' );

		// Success, authenticated user and connected site
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData( array( 'code' => 'success' ), $response );
	}

	/**
	 * Test connection url build when there's no blog token or id.
	 *
	 * @since 4.4.0
	 */
	public function test_build_connect_url_no_blog_token_id() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Build URL to compare scheme and host with the one in response
		$admin_url = wp_parse_url( admin_url() );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection/url' );

		// Success, URL was built
		$this->assertResponseStatus( 200, $response );

		// Format data to test it
		$response->data = wp_parse_url( $response->data );
		parse_str( $response->data['query'], $response->data['query'] );

		// It has a nonce
		$this->assertTrue( isset( $response->data['query']['_wpnonce'] ) );
		unset( $response->data['query']['_wpnonce'] );

		// The URL was properly built
		$this->assertResponseData(
			array(
				'scheme' => $admin_url['scheme'],
				'host'   => $admin_url['host'],
				'path'   => '/wp-admin/admin.php',
				'query'  =>
					array(
						'page'   => 'jetpack',
						'action' => 'register',
					),
			),
			$response
		);
	}

	/**
	 * Test onboarding token and make sure it's a network option.
	 *
	 * @since 5.4.0
	 */
	public function test_check_onboarding_token() {
		$this->assertFalse( Jetpack_Options::get_option( 'onboarding' ) );

		Jetpack::create_onboarding_token();

		$this->assertTrue( Jetpack_Options::is_valid( array( 'onboarding' ) ) );
		$this->assertTrue( ctype_alnum( Jetpack_Options::get_option( 'onboarding' ) ) );
		$this->assertContains( 'onboarding', Jetpack_Options::get_option_names( 'network' ) );
	}

	/**
	 * Test connection url build when there's a blog token or id.
	 *
	 * @since 4.4.0
	 */
	public function test_build_connect_url_blog_token_and_id() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Mock site already registered
		Jetpack_Options::update_option( 'blog_token', 'h0n3y.b4dg3r' );
		Jetpack_Options::update_option( 'id', '42' );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection/url' );

		// Success, URL was built
		$this->assertResponseStatus( 200, $response );

		$response->data = wp_parse_url( $response->data );
		parse_str( $response->data['query'], $response->data['query'] );

		// Because dotcom will not respond to a fake token, the method
		// generates a register URL
		$this->assertContains( 'register', $response->data['query'] );

		unset( $response->data['query'] );
		$this->assertResponseData(
			array(
				'scheme' => 'http',
				'host'   => 'example.org',
				'path'   => '/wp-admin/admin.php',
			),
			$response
		);
	}

	/**
	 * Test unlink user.
	 *
	 * @since 4.4.0
	 */
	public function test_unlink_user() {

		// Create an admin user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_connect_user' );
		wp_set_current_user( $user->ID );

		// Mock site already registered
		Jetpack_Options::update_option( 'blog_token', 'h0n3y.b4dg3r' );
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

		add_filter( 'pre_http_request', array( $this, 'mock_xmlrpc_success' ), 10, 3 );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection/user', array( 'linked' => false ), 'POST' );

		// Success status, users can unlink themselves
		$this->assertResponseStatus( 200, $response );

		// Set up user as master user
		Jetpack_Options::update_option( 'master_user', $user->ID );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection/user', array( 'linked' => false ), 'POST' );

		// User can't unlink because doesn't have permission
		$this->assertResponseStatus( 403, $response );

		// Add proper permission
		$user->set_role( 'administrator' );
		wp_set_current_user( 0 );
		wp_set_current_user( $user->ID );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection/user', array( 'linked' => false ), 'POST' );

		remove_filter( 'pre_http_request', array( $this, 'mock_xmlrpc_success' ), 10, 3 );

		// No way. Master user can't be unlinked. This is intended
		$this->assertResponseStatus( 403, $response );
	}

	/** Test unlinking a user will also remove related cached data.
	 *
	 * @since 8.8.0
	 */
	public function test_unlink_user_cache_data_removal() {

		// Create an admin user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_connect_user' );
		wp_set_current_user( $user->ID );

		// Mock site already registered.
		Jetpack_Options::update_option( 'blog_token', 'h0n3y.b4dg3r' );
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );
		// Add a dummy transient.
		$transient_key = "jetpack_connected_user_data_$user->ID";
		set_transient( $transient_key, 'dummy', DAY_IN_SECONDS );

		add_filter( 'pre_http_request', array( $this, 'mock_xmlrpc_success' ), 10, 3 );

		// Create REST request in JSON format and dispatch.
		$this->create_and_get_request( 'connection/user', array( 'linked' => false ), 'POST' );

		remove_filter( 'pre_http_request', array( $this, 'mock_xmlrpc_success' ), 10, 3 );

		// Transient should be deleted after unlinking user.
		$this->assertFalse( get_transient( $transient_key ) );
	}

	/**
	 * Test that a setting using 'enum' property is saved correctly.
	 *
	 * @since 4.4.0
	 */
	public function test_setting_enum_save() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_activate_modules' );
		wp_set_current_user( $user->ID );

		Jetpack::update_active_modules( array( 'carousel' ) );

		// Test endpoint that will be removed in 4.5
		$response = $this->create_and_get_request( 'module/carousel', array( 'carousel_background_color' => 'black' ), 'POST' );
		$this->assertResponseStatus( 200, $response );

		// Test endpoint that will be implemented in 4.5
		$response = $this->create_and_get_request( 'settings/carousel', array( 'carousel_background_color' => 'white' ), 'POST' );
		$this->assertResponseStatus( 200, $response );

		$response = $this->create_and_get_request( 'settings', array( 'carousel_background_color' => 'black' ), 'POST' );
		$this->assertResponseStatus( 200, $response );

		// It should also save correctly with a POST body that is not JSON encoded
		$response = $this->create_and_get_request( 'settings', array(), 'POST', array( 'carousel_background_color' => 'black' ) );
		$this->assertResponseStatus( 200, $response );
	}

	/**
	 * Test that an arg with array type can be saved.
	 *
	 * @since 4.4.0
	 */
	public function test_setting_array_type() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_activate_modules' );
		wp_set_current_user( $user->ID );

		Jetpack::update_active_modules( array( 'sharedaddy' ) );

		// Verify that saving another thing fails
		$response = $this->create_and_get_request( 'settings', array( 'show' => 'post' ), 'POST' );
		$this->assertResponseStatus( 400, $response );

		$response = $this->create_and_get_request( 'settings', array( 'show' => array( 'post', 'page' ) ), 'POST' );
		$this->assertResponseStatus( 200, $response );

		// It should also work correctly with a POST body that is not JSON encoded
		$response = $this->create_and_get_request( 'settings', array(), 'POST', array( 'show' => 'post' ) );
		$this->assertResponseStatus( 400, $response );

		$response = $this->create_and_get_request( 'settings', array(), 'POST', array( 'show' => array( 'post', 'page' ) ) );
		$this->assertResponseStatus( 200, $response );
	}

	/**
	 * Test that a setting is retrieved correctly.
	 * Here we test three types of settings:
	 * - module settings
	 * - module activation state
	 *
	 * @since 4.6.0
	 */
	public function test_settings_retrieve() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_activate_modules' );
		wp_set_current_user( $user->ID );

		Jetpack::update_active_modules( array( 'carousel' ) );
		update_option( 'carousel_background_color', 'white' );

		$response      = $this->create_and_get_request( 'settings', array(), 'GET' );
		$response_data = $response->get_data();

		$this->assertResponseStatus( 200, $response );

		$this->assertArrayHasKey( 'carousel_background_color', $response_data );
		$this->assertEquals( 'white', $response_data['carousel_background_color'] );

		$this->assertArrayHasKey( 'carousel', $response_data );
		$this->assertTrue( $response_data['carousel'] );
	}

	/**
	 * Test fetching milestone widget data.
	 *
	 * @since 5.5.0
	 */
	public function test_fetch_milestone_widget_data() {
		jetpack_register_widget_milestone();

		global $_wp_sidebars_widgets, $wp_registered_widgets;

		$widget_instances = array(
			3 => array(
				'title'   => 'Ouou',
				'event'   => 'The Biog Day',
				'unit'    => 'years',
				'type'    => 'until',
				'message' => 'The big day is here.',
				'year'    => gmdate( 'Y' ) + 10,
				'month'   => gmdate( 'm' ),
				'hour'    => '0',
				'min'     => '00',
				'day'     => gmdate( 'd' ),
			),
		);

		update_option( 'widget_milestone_widget', $widget_instances );

		$sidebars = wp_get_sidebars_widgets();
		foreach ( $sidebars as $key => $sidebar ) {
			$sidebars[ $key ][] = 'milestone_widget-3';
		}
		$_wp_sidebars_widgets = $sidebars;
		wp_set_sidebars_widgets( $sidebars );

		$wp_registered_widgets['milestone_widget-3'] = array(
			'name'     => 'Milestone Widget',
			'id'       => 'milestone_widget-3',
			'callback' => array( 'Milestone_Widget', 'widget' ),
			'params'   => array(),
		);

		$response = $this->create_and_get_request( 'widgets/milestone_widget-3', array(), 'GET' );

		// Should return the widget data
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData(
			array(
				'message' => '<div class="milestone-countdown"><span class="difference">10</span> <span class="label">years to go.</span></div>',
			),
			$response
		);

		$widget_instances[3] = array_merge(
			$widget_instances[3],
			array(
				'year' => gmdate( 'Y' ) + 1,
				'unit' => 'months',
			)
		);
		update_option( 'widget_milestone_widget', $widget_instances );
		$response = $this->create_and_get_request( 'widgets/milestone_widget-3', array(), 'GET' );

		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData(
			array(
				'message' => '<div class="milestone-countdown"><span class="difference">12</span> <span class="label">months to go.</span></div>',
			),
			$response
		);

		// Cleaning up the sidebars
		$sidebars = wp_get_sidebars_widgets();
		foreach ( $sidebars as $key => $sidebar ) {
			$sidebars[ $key ] = array_diff( $sidebar, array( 'milestone_widget-3' ) );
		}
		$_wp_sidebars_widgets = $sidebars;
		wp_set_sidebars_widgets( $sidebars );
	}

	/**
	 * Test fetching a widget that does not exist.
	 *
	 * @since 5.5.0
	 */
	public function test_fetch_nonexistent_widget_data() {
		jetpack_register_widget_milestone();

		$response = $this->create_and_get_request( 'widgets/some_other_slug-133', array(), 'GET' );

		// Fails because there is no such widget
		$this->assertResponseStatus( 404, $response );

		unregister_widget( 'Milestone_Widget' );
	}

	/**
	 * Test fetching a nonexistent instance of an existing widget.
	 *
	 * @since 5.5.0
	 */
	public function test_fetch_nonexistent_widget_instance_data() {
		jetpack_register_widget_milestone();

		$response = $this->create_and_get_request( 'widgets/milestone_widget-333', array(), 'GET' );

		// Fails because there is no such widget instance
		$this->assertResponseStatus( 404, $response );

		unregister_widget( 'Milestone_Widget' );
	}

	/**
	 * Test fetching a widget that exists but has not been registered.
	 *
	 * @since 5.5.0
	 */
	public function test_fetch_not_registered_widget_data() {
		update_option(
			'widget_milestone_widget',
			array(
				3 => array(
					'title' => 'Ouou',
					'event' => 'The Biog Day',
				),
			)
		);

		foreach ( wp_get_sidebars_widgets() as $sidebar ) {
			$this->assertFalse( array_search( 'milestone_widget-3', $sidebar, true ) );
		}

		$response = $this->create_and_get_request( 'widgets/milestone_widget-3', array(), 'GET' );

		// Fails because the widget is inactive
		$this->assertResponseStatus( 404, $response );
	}

	/**
	 * Test saving and retrieving the recommendations data.
	 *
	 * @since 9.3.0
	 */
	public function test_recommendations_data() {
		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_configure_modules' );
		wp_set_current_user( $user->ID );

		$test_data = array(
			'param1' => 'val1',
			'param2' => 'val2',
		);

		$response = $this->create_and_get_request(
			'recommendations/data',
			array(
				'data' => $test_data,
			),
			'POST'
		);
		$this->assertResponseStatus( 200, $response );
		$this->assertTrue( $response->get_data() );

		$response = $this->create_and_get_request( 'recommendations/data', array(), 'GET' );
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData( $test_data, $response );
	}

	/**
	 * Test saving and retrieving the recommendations step.
	 *
	 * @since 9.3.0
	 */
	public function test_recommendations_step() {
		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_configure_modules' );
		wp_set_current_user( $user->ID );

		$test_data = 'step-1';

		$response = $this->create_and_get_request(
			'recommendations/step',
			array(
				'step' => $test_data,
			),
			'POST'
		);
		$this->assertResponseStatus( 200, $response );
		$this->assertTrue( $response->get_data() );

		$response = $this->create_and_get_request( 'recommendations/step', array(), 'GET' );
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData( array( 'step' => $test_data ), $response );
	}

	/**
	 * Test fetching user connection data without a connection owner.
	 *
	 * @since 9.4
	 */
	public function test_get_user_connection_data_without_master_user() {
		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );
		// No master user set.
		$response = $this->create_and_get_request( 'connection/data' );
		$this->assertResponseStatus( 200, $response );

		$response_data = $response->get_data();
		$this->assertNull( $response_data['connectionOwner'] );
	}

	/**
	 * Test fetching user connection data with connected user.
	 *
	 * @covers Jetpack::filter_jetpack_current_user_connection_data
	 * @since 10.0
	 */
	public function test_get_user_connection_data_with_connected_user() {
		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );
		// Mock a connection.
		Jetpack_Options::update_option( 'master_user', $user->ID );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asd.qwe.1' );
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

		// Set up some dummy cached user connection data.
		$dummy_wpcom_user_data = array(
			'ID'           => 999,
			'email'        => 'jane.doe@foobar.com',
			'display_name' => 'Jane Doe',
		);
		$transient_key         = 'jetpack_connected_user_data_' . $user->ID;
		set_transient( $transient_key, $dummy_wpcom_user_data );

		$response = $this->create_and_get_request( 'connection/data' );
		$this->assertResponseStatus( 200, $response );

		delete_transient( $transient_key );

		$this->assertEquals( 200, $response->get_status() );

		$response_data = $response->get_data();
		// Remove avatar as the url is random.
		unset( $response_data['currentUser']['wpcomUser']['avatar'] );

		$this->assertTrue( $response_data['currentUser']['isConnected'] );
		$this->assertTrue( $response_data['currentUser']['isMaster'] );
		$this->assertSame( $user->user_login, $response_data['currentUser']['username'] );
		$this->assertSame( $user->ID, $response_data['currentUser']['id'] );
		$this->assertSame( $dummy_wpcom_user_data, $response_data['currentUser']['wpcomUser'] );
		$this->assertSame( $user->user_login, $response_data['connectionOwner'] );

		$expected_permissions = array(
			'connect',
			'connect_user',
			'disconnect',
			'admin_page',
			'manage_modules',
			'network_admin',
			'network_sites_page',
			'edit_posts',
			'publish_posts',
			'view_stats',
			'manage_plugins',
		);
		$this->assertEmpty( array_diff( $expected_permissions, array_keys( $response_data['currentUser']['permissions'] ) ) );
	}

	/**
	 * Test fetching a site's purchase token.
	 *
	 * @since 9.9.0
	 */
	public function test_get_purchase_token() {
		$purchase_token = '1ApurchaseToken1';
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'purchase_token', $purchase_token );

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Fetch purchase token.
		$response = $this->create_and_get_request( 'purchase-token', array(), 'GET' );

		// Confirm purchase token exists.
		$this->assertResponseStatus( 200, $response );
		$this->assertEquals( $purchase_token, $response->get_data() );
	}

	/**
	 * Test fetching a site's purchase token with a non-administrator user.
	 *
	 * @since 9.9.0
	 */
	public function test_get_purchase_token_non_admin_user() {
		$purchase_token = '1ApurchaseToken1';
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'purchase_token', $purchase_token );

		// Create a user and set it up as current.
		$user = $this->create_and_get_user();
		wp_set_current_user( $user->ID );

		// Fetch purchase token.
		$response = $this->create_and_get_request( 'purchase-token', array(), 'GET' );

		// Request fails because the user doesn't have the `manage_options` permission.
		$this->assertResponseStatus( 403, $response );
		$this->assertResponseData( array( 'code' => 'invalid_permission_manage_purchase_token' ), $response );
	}

	/**
	 * Test fetching a site's purchase token when no site is registered.
	 *
	 * @since 9.9.0
	 */
	public function test_get_purchase_token_no_site_registered() {
		$purchase_token = '1ApurchaseToken1';
		Jetpack_Options::update_option( 'purchase_token', $purchase_token );

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Fetch purchase token.
		$response = $this->create_and_get_request( 'purchase-token', array(), 'GET' );

		// Confirm that the request failed.
		$this->assertResponseStatus( 500, $response );
		$this->assertResponseData( array( 'code' => 'site_not_registered' ), $response );
	}

	/**
	 * Test deleting a site's purchase token.
	 *
	 * @since 9.9.0
	 */
	public function test_delete_purchase_token() {
		$purchase_token = '1ApurchaseToken1';
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'purchase_token', $purchase_token );

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Fetch the purchase token.
		$response = $this->create_and_get_request( 'purchase-token', array(), 'GET' );

		// Confirm the purchase token exists.
		$this->assertResponseStatus( 200, $response );
		$this->assertEquals( $purchase_token, $response->get_data() );

		// Delete the purchase token.
		$response = $this->create_and_get_request( 'purchase-token', array(), 'POST' );

		$this->assertResponseStatus( 200, $response );
		$this->assertTrue( $response->get_data() );

		// Fetch purchase token again.
		$response = $this->create_and_get_request( 'purchase-token', array(), 'GET' );

		// Confirm the purchase token does not exist.
		$this->assertResponseStatus( 200, $response );
		$this->assertSame( '', $response->get_data() );
	}

	/**
	 * Test deleting a site's purchase token with a non-administrator user.
	 *
	 * @since 9.9.0
	 */
	public function test_delete_purchase_token_non_admin_user() {
		$purchase_token = '1ApurchaseToken1';
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'purchase_token', $purchase_token );

		// Create a user and set it up as current.
		$user = $this->create_and_get_user();
		wp_set_current_user( $user->ID );

		// Fetch the purchase token.
		$response = $this->create_and_get_request( 'purchase-token', array(), 'GET' );

		// Request fails because the user doesn't have the `manage_options` permission.
		$this->assertResponseStatus( 403, $response );
		$this->assertResponseData( array( 'code' => 'invalid_permission_manage_purchase_token' ), $response );
	}

	/**
	 * Test deleting a site's purchase token when no site is registered.
	 *
	 * @since 9.9.0
	 */
	public function test_delete_purchase_token_no_site_registered() {
		$purchase_token = '1ApurchaseToken1';
		Jetpack_Options::update_option( 'purchase_token', $purchase_token );

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Fetch purchase token.
		$response = $this->create_and_get_request( 'purchase-token', array(), 'POST' );

		// Confirm that the request failed.
		$this->assertResponseStatus( 500, $response );
		$this->assertResponseData( array( 'code' => 'site_not_registered' ), $response );
	}

	/**
	 * Test the `/seen-wc-connection-modal` endpoint fails.
	 *
	 * @since 10.4.0
	 */
	public function test_post_seen_wc_connection_modal_with_invalid_user_permissions() {
		wp_set_current_user( 0 );

		$response = $this->create_and_get_request( 'seen-wc-connection-modal', array(), 'POST' );

		$this->assertResponseStatus( rest_authorization_required_code(), $response );
	}

	/**
	 * Test the `/seen-wc-connection-modal` endpoint succeeds.
	 *
	 * @since 10.4.0
	 */
	public function test_post_seen_wc_connection_modal_success() {
		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		$response = $this->create_and_get_request( 'seen-wc-connection-modal', array(), 'POST' );

		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData( array( 'success' => true ), $response );
	}
} // class end

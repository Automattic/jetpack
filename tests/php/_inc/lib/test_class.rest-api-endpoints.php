<?php
/**
 * Class for REST API endpoints testing.
 *
 * @since 4.4.0
 */
require_once( dirname( __FILE__ ) . '/../../../../modules/widgets/milestone.php' );

class WP_Test_Jetpack_REST_API_endpoints extends WP_UnitTestCase {

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
	public function setUp() {

		parent::setUp();

		global $wp_rest_server;
		$this->server = $wp_rest_server = new WP_REST_Server;
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean environment for REST API endpoints test.
	 *
	 * @since 4.4.0
	 */
	public function tearDown() {
		parent::tearDown();

		global $wp_rest_server;
		$wp_rest_server = null;
	}

	/**
	 * Loads the REST API endpoints to test their methods directly.
	 *
	 * @since 4.4.0
	 */
	protected function load_rest_endpoints_direct() {
		require_once dirname( __FILE__ ) . '/../../../../_inc/lib/class.core-rest-api-endpoints.php';
	}

	/**
	 * Get Jetpack connection status.
	 *
	 * @since 4.4.0
	 *
	 * @return array
	 */
	protected function get_jetpack_connection_status() {
		$status = Jetpack_Core_Json_Api_Endpoints::jetpack_connection_status();
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
		return $this->factory->user->create_and_get( array(
			'role' => empty( $role ) ? 'subscriber' : $role,
		) );
	}

	/**
	 * Creates a WP_REST_Request and returns it.
	 *
	 * @since 4.4.0
	 *
	 * @param string $route       REST API path to be append to /jetpack/v4/
	 * @param array  $json_params When present, parameters are added to request in JSON format
	 * @param string $method      Request method to use, GET or POST
	 * @param array  $params      Parameters to add to endpoint
	 *
	 * @return WP_REST_Response
	 */
	protected function create_and_get_request( $route = '', $json_params = array(), $method = 'GET', $params = array() ) {
		$request = new WP_REST_Request( $method, "/jetpack/v4/$route" );

		if ( 'GET' !== $method && !empty( $json_params ) ) {
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
	 * Should be hooked on the `http_response` filter.
	 *
	 * @param array|obj $response HTTP Response.
	 * @param array     $args     HTTP request arguments.
	 * @param string    $url      The request URL.
	 *
	 * @return WP_REST_Response
	 */
	public function mock_xmlrpc_success( $response, $args, $url ) {
		if ( strpos( $url, 'https://jetpack.wordpress.com/xmlrpc.php' ) !== false ) {
			$response['body'] = '
				<methodResponse>
					<params>
						<param>
							<value>1</value>
						</param>
					</params>
				</methodResponse>
			';
		}

		return $response;
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
			if ( isset( $response_data[$key] ) ) {
				$tested_data[$key] = $response_data[$key];
			} else {
				$tested_data[$key] = null;
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

		// It should not work in Dev Mode
		add_filter( 'jetpack_development_mode', '__return_true' );

		// Subscribers only have access to connect, which is not available in Dev Mode so this should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::view_admin_page_permission_check() );

		// Set user as admin
		$user->set_role( 'administrator' );

		// Reset user and setup globals again to reflect the role change.
		wp_set_current_user( 0 );
		wp_set_current_user( $user->ID );

		// Admins have acces to everything, to this should work
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::view_admin_page_permission_check() );

		remove_filter( 'jetpack_development_mode', '__return_true' );
	}

	/**
	 * Test permission to connect Jetpack site or link user.
	 *
	 * @since 4.4.0
	 */
	public function test_connection_permission() {

		$this->load_rest_endpoints_direct();

		// Current user doesn't have credentials, so checking permissions should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::get_user_connection_data_permission_callback() );

		// Setup a new current user with specified capability
		$user = $this->create_and_get_user();

		// Add Jetpack capability
		$user->add_cap( 'jetpack_connect_user' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// User has capability so this should work this time
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::get_user_connection_data_permission_callback() );

		// It should not work in Dev Mode
		add_filter( 'jetpack_development_mode', '__return_true' );

		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::get_user_connection_data_permission_callback() );

		remove_filter( 'jetpack_development_mode', '__return_true' );
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
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::activate_plugins_permission_check() );

		$user = $this->create_and_get_user();

		// Add Jetpack capability
		$user->add_cap( 'jetpack_admin_page' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// Should fail because requires more capabilities
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::activate_plugins_permission_check() );

		// Add Jetpack capability
		$user->add_cap( 'activate_plugins' );

		// Reset current user and setup global variables to refresh the capability we just added.
		wp_set_current_user( 0 );
		wp_set_current_user( $user->ID );

		// User has capability so this should work this time
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::activate_plugins_permission_check() );

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

		// Create a user
		$user = $this->create_and_get_user();

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

		// Create a user and set it up as current.
		$user = $this->create_and_get_user();
		wp_set_current_user( $user->ID );

		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $user->ID );
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection' );

		// Success, authenticated user and connected site
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData( array(
			'isActive'  => true,
			'isStaging' => false,
			'devMode'   => array(
				'isActive' => false,
				'constant' => false,
				'url'      => false,
				'filter'   => false,
			),
		), $response );
	}

	/**
	 * Test information about connection status in staging mode.
	 *
	 * @since 4.4.0
	 */
	public function test_jetpack_connection_status_staging() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user();
		wp_set_current_user( $user->ID );

		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $user->ID );
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

		add_filter( 'jetpack_is_staging_site', '__return_true' );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection' );

		// Success, authenticated user and connected site
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData( array(
			'isActive'  => true,
			'isStaging' => true,
			'devMode'   => array(
				'isActive' => false,
				'constant' => false,
				'url'      => false,
				'filter'   => false,
			),
		), $response );

		remove_filter( 'jetpack_is_staging_site', '__return_true' );
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

		add_filter( 'jetpack_development_mode', '__return_true' );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection' );

		// Success, authenticated user and connected site
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData( array(
			'isActive'  => false,
			'isStaging' => false,
			'devMode'   => array(
				'isActive' => true,
				'constant' => false,
				'url'      => false,
				'filter'   => true,
			),
		), $response );

		remove_filter( 'jetpack_development_mode', '__return_true' );
	}

	/**
	 * Test site disconnection with not authenticated user
	 *
	 * @since 4.4.0
	 */
	public function test_disconnect_site_noauth() {

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection', array(), 'POST' );

		// Fails because user is not authenticated
		$this->assertResponseStatus( 401, $response );
		$this->assertResponseData( array( 'code' => 'invalid_user_permission_jetpack_disconnect' ), $response );
	}

	/**
	 * Test site disconnection with authenticated user and disconnected site
	 *
	 * @since 4.4.0
	 */
	public function test_disconnect_site_auth_noparam() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		wp_set_current_user( $user->ID );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection', array(), 'POST' );

		// Fails because user is authenticated but missing a param
		$this->assertResponseStatus( 404, $response );
		$this->assertResponseData( array( 'code' => 'invalid_param' ), $response );
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
		$admin_url = parse_url( admin_url() );

		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'connection/url' );

		// Success, URL was built
		$this->assertResponseStatus( 200, $response );

		// Format data to test it
		$response->data = parse_url( $response->data );
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
						'page'     => 'jetpack',
						'action'   => 'register',
					)
			), $response
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
		$this->assertTrue( in_array( 'onboarding', Jetpack_Options::get_option_names( 'network' ) ) );
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

		$response->data = parse_url( $response->data );
		parse_str( $response->data['query'], $response->data['query'] );

		// Because dotcom will not respond to a fake token, the method
		// generates a register URL
		$this->assertContains( 'register', $response->data['query'] );

		unset( $response->data['query'] );
		$this->assertResponseData(
			array(
				'scheme' => 'http',
				'host'   => 'example.org',
				'path'   => '/wp-admin/admin.php'
			), $response
		);
	}

	/**
	 * Test unlink user.
	 *
	 * @since 4.4.0
	 */
	public function test_unlink_user() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user();
		$user->add_cap( 'jetpack_connect_user' );
		wp_set_current_user( $user->ID );

		// Mock site already registered
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

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

		// No way. Master user can't be unlinked. This is intended
		$this->assertResponseStatus( 403, $response );

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
		$response = $this->create_and_get_request( 'settings', array(), 'POST',  array( 'show' => 'post' ) );
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

		$response = $this->create_and_get_request( 'settings', array(), 'GET' );
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
				'title' => 'Ouou',
				'event' => 'The Biog Day',
				'unit' => 'years',
				'type' => 'until',
				'message' => 'The big day is here.',
				'year' => date( 'Y' ) + 10,
				'month' => date( 'm' ),
				'hour' => '0',
				'min' => '00',
				'day' => date( 'd' )
			)
		);

		update_option( 'widget_milestone_widget', $widget_instances );

		$sidebars = wp_get_sidebars_widgets();
		foreach( $sidebars as $key => $sidebar ) {
			$sidebars[ $key ][] = 'milestone_widget-3';
		}
		$_wp_sidebars_widgets = $sidebars;
		wp_set_sidebars_widgets( $sidebars );

		$wp_registered_widgets['milestone_widget-3'] = array(
			'name' => 'Milestone Widget',
			'id' => 'milestone_widget-3',
			'callback' => array( 'Milestone_Widget', 'widget' ),
			'params' => array()
		);

		$response = $this->create_and_get_request( 'widgets/milestone_widget-3', array(), 'GET' );

		// Should return the widget data
		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData(
			array(
				'message' => '<div class="milestone-countdown"><span class="difference">10</span> <span class="label">years to go.</span></div>'
			),
			$response
		);

		$widget_instances[3] = array_merge(
			$widget_instances[3],
			array(
				'year' => date( 'Y' ) + 1,
				'unit' => 'months',
			)
		);
		update_option( 'widget_milestone_widget', $widget_instances );
		$response = $this->create_and_get_request( 'widgets/milestone_widget-3', array(), 'GET' );

		$this->assertResponseStatus( 200, $response );
		$this->assertResponseData(
			array(
				'message' => '<div class="milestone-countdown"><span class="difference">12</span> <span class="label">months to go.</span></div>'
			),
			$response
		);

		// Cleaning up the sidebars
		$sidebars = wp_get_sidebars_widgets();
		foreach( $sidebars as $key => $sidebar ) {
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
				)
			)
		);

		foreach( wp_get_sidebars_widgets() as $sidebar ) {
			$this->assertFalse( array_search( 'milestone_widget-3', $sidebar ) );
		}

		$response = $this->create_and_get_request( 'widgets/milestone_widget-3', array(), 'GET' );

		// Fails because the widget is inactive
		$this->assertResponseStatus( 404, $response );
	}

	/**
	 * Test changing the master user.
	 *
	 * @since 6.2.0
	 * @since 7.7.0 No longer need to be master user to update.
	 */
	public function test_change_owner() {

		// Create a user and set it up as current.
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_disconnect' );
		wp_set_current_user( $user->ID );

		// Mock site already registered
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

		// Set up user as master user
		Jetpack_Options::update_option( 'master_user', $user->ID );

		// Attempt owner change with bad user
		$response = $this->create_and_get_request( 'connection/owner', array( 'owner' => 999 ), 'POST' );
		$this->assertResponseStatus( 400, $response );

		// Attempt owner change to same user
		$response = $this->create_and_get_request( 'connection/owner', array( 'owner' => $user->ID ), 'POST' );
		$this->assertResponseStatus( 400, $response );

		// Create another user
		$new_owner = $this->create_and_get_user( 'administrator' );
		Jetpack_Options::update_option( 'user_tokens', array(
			$user->ID => "honey.badger.$user->ID",
			$new_owner->ID => "honey.badger.$new_owner->ID",
		) );

		// Change owner to valid user
		add_filter( 'http_response', array( $this, 'mock_xmlrpc_success' ), 10, 3 );
		$response = $this->create_and_get_request( 'connection/owner', array( 'owner' => $new_owner->ID ), 'POST' );
		$this->assertResponseStatus( 200, $response );
		$this->assertEquals( $new_owner->ID, Jetpack_Options::get_option( 'master_user' ), 'Master user not changed' );
		remove_filter( 'http_response', array( $this, 'mock_xmlrpc_success' ), 10 );
	}


} // class end

<?php
/**
 * Class for REST API endpoints testing.
 *
 * @since 4.4.0
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/../../../../modules/widgets/milestone.php';

/**
 * phpcs:disable PEAR.NamingConventions.ValidClassName.Invalid
 */
class Jetpack_REST_API_endpoints_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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
		return $status->data ?? array();
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
			$request->set_body( json_encode( $json_params, JSON_UNESCAPED_SLASHES ) );
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
		$user = $this->create_and_get_user( 'contributor' );

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
		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			$this->markTestSkipped( 'is temporarily skipped' );
		}

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
		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			$this->markTestSkipped( 'is temporarily skipped' );
		}

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
					'option'          => false,
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
					'option'          => false,
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

		remove_filter( 'pre_http_request', array( $this, 'mock_xmlrpc_success' ), 10 );

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

		remove_filter( 'pre_http_request', array( $this, 'mock_xmlrpc_success' ), 10 );

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
	 * The Stats role settings reject values that are not a list of role slugs.
	 *
	 * A POST to /module/all is served by the /module/(?P<slug>[a-z\-]+) handler, whose args cover
	 * every updateable setting, so both Stats role options are validated on that request. No user
	 * is set because argument validation does not depend on the current user.
	 *
	 * @dataProvider provider_invalid_stats_roles
	 *
	 * @param string $param Name of the Stats role parameter.
	 * @param mixed  $value Value to submit for that parameter.
	 */
	#[DataProvider( 'provider_invalid_stats_roles' )]
	public function test_stats_roles_reject_values_that_are_not_a_list_of_roles( $param, $value ) {
		wp_set_current_user( 0 );

		$response = $this->create_and_get_request( 'module/all', array( $param => $value ), 'POST' );
		$this->assertResponseStatus( 400, $response );

		// Also reachable with a POST body that is not JSON encoded.
		$response = $this->create_and_get_request( 'module/all', array(), 'POST', array( $param => $value ) );
		$this->assertResponseStatus( 400, $response );
	}

	/**
	 * Values the Stats role settings must refuse.
	 *
	 * @return array[]
	 */
	public static function provider_invalid_stats_roles() {
		return array(
			'string roles'            => array( 'roles', 'http://example.com/x.png' ),
			'string count_roles'      => array( 'count_roles', 'administrator' ),
			'integer roles'           => array( 'roles', 42 ),
			'nested array in roles'   => array( 'roles', array( array( 'administrator' ) ) ),
			'non-string item in list' => array( 'roles', array( 'administrator', 42 ) ),
		);
	}

	/**
	 * The Stats role validator still accepts what it accepted before the type guard.
	 */
	public function test_stats_roles_accept_a_list_of_roles() {
		$this->load_rest_endpoints_direct();

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/settings' );

		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::validate_stats_roles( array( 'administrator', 'editor' ), $request, 'roles' ) );

		// An empty value is allowed; sanitize_stats_allowed_roles() turns it into 'administrator'.
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::validate_stats_roles( array(), $request, 'roles' ) );
		$this->assertSame( array( 'administrator' ), Jetpack_Core_Json_Api_Endpoints::sanitize_stats_allowed_roles( array() ) );

		// A list holding no editable role is still rejected.
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::validate_stats_roles( array( 'not-a-role' ), $request, 'roles' ) );
	}

	/**
	 * A request mixing a Post by Email option with an admin-only one needs the admin capability.
	 *
	 * @return void
	 */
	public function test_settings_post_by_email_bundle_does_not_lower_capability() {
		$user = $this->create_and_get_user( 'contributor' );
		wp_set_current_user( $user->ID );

		update_option( 'jetpack_portfolio', 0 );

		$response = $this->create_and_get_request(
			'settings',
			array(
				'post_by_email_address' => 'regenerate',
				'jetpack_portfolio'     => true,
			),
			'POST'
		);

		$this->assertResponseStatus( 403, $response );
		$this->assertSame( '0', (string) get_option( 'jetpack_portfolio' ) );
	}

	/**
	 * The write loop refuses options outside the Post by Email group without the admin capability.
	 *
	 * @return void
	 */
	public function test_update_data_skips_admin_only_options_for_non_admin() {
		$user = $this->create_and_get_user( 'contributor' );
		wp_set_current_user( $user->ID );

		update_option( 'jetpack_portfolio', 0 );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'jetpack_portfolio' => true ), JSON_UNESCAPED_SLASHES ) );

		$endpoint = new Jetpack_Core_API_Data();
		$result   = $endpoint->update_data( $request );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'some_updated', $result->get_error_code() );
		$this->assertSame( '0', (string) get_option( 'jetpack_portfolio' ) );
	}

	/**
	 * A Contributor may still regenerate their own Post by Email address.
	 *
	 * @return void
	 */
	public function test_settings_post_by_email_alone_is_still_allowed_for_contributor() {
		$user = $this->create_and_get_user( 'contributor' );
		wp_set_current_user( $user->ID );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'post_by_email_address' => 'regenerate' ), JSON_UNESCAPED_SLASHES ) );

		$endpoint = new Jetpack_Core_API_Data();
		$this->assertTrue( $endpoint->can_request( $request ) );
	}

	/**
	 * An administrator can still save a bundled payload.
	 *
	 * @return void
	 */
	public function test_settings_post_by_email_bundle_is_allowed_for_admin() {
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_configure_modules' );
		wp_set_current_user( $user->ID );

		$request = new WP_REST_Request( 'POST', '/jetpack/v4/settings' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post_by_email_address' => 'regenerate',
					'jetpack_portfolio'     => true,
				),
				JSON_UNESCAPED_SLASHES
			)
		);

		$endpoint = new Jetpack_Core_API_Data();
		$this->assertTrue( $endpoint->can_request( $request ) );
	}

	/**
	 * Regression for NL-618: re-posting newsletter categories with the same selection the option
	 * already holds must return 200, not a `some_updated` 400. The previous code left `$updated`
	 * false on the "values equal" short-circuit, so any save without an actual change blew up.
	 *
	 * @return void
	 */
	public function test_wpcom_newsletter_categories_same_value_returns_success() {
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_activate_modules' );
		wp_set_current_user( $user->ID );

		$category_id = self::factory()->category->create();
		// Pre-seed the option in canonical form, matching what the helper saves.
		update_option( 'wpcom_newsletter_categories', array( array( 'term_id' => $category_id ) ) );

		$response = $this->create_and_get_request(
			'settings',
			array( 'wpcom_newsletter_categories' => array( $category_id ) ),
			'POST'
		);
		$this->assertResponseStatus( 200, $response );
	}

	/**
	 * Regression for NL-618: posting an empty array must be a no-op success, not a 400.
	 * The frontend strips the key for empty selections, but defensive code should still treat
	 * "nothing to save" as success rather than a failed update.
	 *
	 * @return void
	 */
	public function test_wpcom_newsletter_categories_empty_value_returns_success() {
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_activate_modules' );
		wp_set_current_user( $user->ID );

		$response = $this->create_and_get_request(
			'settings',
			array( 'wpcom_newsletter_categories' => array() ),
			'POST'
		);
		$this->assertResponseStatus( 200, $response );
	}

	/**
	 * A real change to newsletter categories still persists through the same code path.
	 *
	 * @return void
	 */
	public function test_wpcom_newsletter_categories_new_value_is_saved() {
		$user = $this->create_and_get_user( 'administrator' );
		$user->add_cap( 'jetpack_activate_modules' );
		wp_set_current_user( $user->ID );

		$category_id = self::factory()->category->create();

		$response = $this->create_and_get_request(
			'settings',
			array( 'wpcom_newsletter_categories' => array( $category_id ) ),
			'POST'
		);
		$this->assertResponseStatus( 200, $response );
		$this->assertSame(
			array( $category_id ),
			Jetpack_Newsletter_Category_Helper::get_category_ids()
		);
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

	/**
	 * Test the 'features/available' endpoint, unauthorized.
	 *
	 * @since 13.9
	 */
	public function test_features_available_unauthorized() {
		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'features/available' );

		$this->assertResponseStatus( 401, $response );
		$this->assertResponseData( array( 'code' => 'invalid_permission_fetch_features' ), $response );
	}

	/**
	 * Test the 'features/enabled' endpoint, unauthorized.
	 *
	 * @since 13.9
	 */
	public function test_features_enabled_unauthorized() {
		// Create REST request in JSON format and dispatch
		$response = $this->create_and_get_request( 'features/enabled' );

		$this->assertResponseStatus( 401, $response );
		$this->assertResponseData( array( 'code' => 'invalid_permission_fetch_features' ), $response );
	}
	// ---- Connection test endpoints (migrated to Connection package) ----

	/**
	 * Test the 'connection/test' and 'connection/test-wpcom' routes are registered.
	 * Auth behavior is tested in the Connection package; here we verify the wiring.
	 */
	public function test_connection_test_routes_are_registered() {
		$routes = $this->server->get_routes();
		$this->assertArrayHasKey( '/jetpack/v4/connection/test', $routes );
		$this->assertArrayHasKey( '/jetpack/v4/connection/test-wpcom', $routes );
	}

	/**
	 * Test that Jetpack hooks into jetpack_connection_tests_loaded to register its tests.
	 */
	public function test_jetpack_registers_connection_tests_hook() {
		$jetpack = Jetpack::init();
		$this->assertIsInt(
			has_action( 'jetpack_connection_tests_loaded', array( $jetpack, 'register_jetpack_connection_tests' ) ),
			'Jetpack should hook register_jetpack_connection_tests onto jetpack_connection_tests_loaded.'
		);
	}

	/**
	 * Test that Jetpack-specific connection tests (sync health) are registered
	 * on the Connection_Health_Tests suite via the jetpack_connection_tests_loaded action.
	 */
	public function test_jetpack_connection_tests_registered() {
		$cxntests = new Automattic\Jetpack\Connection\Connection_Health_Tests();
		$tests    = $cxntests->list_tests();

		$test_names = array_keys( $tests );
		$this->assertContains( 'test__sync_health', $test_names, 'Jetpack sync health test should be registered on the connection test suite.' );
	}

	/**
	 * Register a subscription service that reports a valid subscriber token, so
	 * set_subscriber_cookie_and_redirect() reaches its redirect logic without a
	 * live Jetpack connection. Filter is removed automatically at tear_down.
	 */
	private function mock_valid_subscriber_token() {
		require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';

		add_filter(
			'earn_premium_content_subscription_service',
			static function () {
				return new class() extends \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Jetpack_Token_Subscription_Service {
					public function get_and_set_token_from_request() {
						return 'valid-token';
					}
					public function decode_token( $token ) {
						return 'valid-token' === $token
							? array(
								'blog_id'       => 123,
								'subscriptions' => array(),
							)
							: null;
					}
				};
			},
			99
		);
	}

	/**
	 * The subscriber auth endpoint must not redirect to an external host.
	 *
	 * Regression test for NL-761: a valid subscriber token combined with an
	 * attacker-controlled redirect_url turned the endpoint into an open redirect.
	 */
	public function test_subscriber_auth_rejects_external_redirect() {
		$this->load_rest_endpoints_direct();
		$this->mock_valid_subscriber_token();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/subscribers/auth' );
		$request->set_param( 'redirect_url', 'https://attacker.example/phishing' );

		$response = Jetpack_Core_Json_Api_Endpoints::set_subscriber_cookie_and_redirect( $request );

		$this->assertInstanceOf( 'WP_Error', $response, 'An external redirect target must be rejected.' );
		$this->assertSame( 'invalid-redirect', $response->get_error_code() );
		$error_data = $response->get_error_data();
		$this->assertSame( 400, $error_data['status'], 'A rejected redirect must surface as an HTTP 400.' );
	}

	/**
	 * A protocol-relative redirect_url (//attacker.example) must also be rejected,
	 * since browsers treat it as an absolute cross-host redirect.
	 */
	public function test_subscriber_auth_rejects_protocol_relative_redirect() {
		$this->load_rest_endpoints_direct();
		$this->mock_valid_subscriber_token();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/subscribers/auth' );
		$request->set_param( 'redirect_url', '//attacker.example/phishing' );

		$response = Jetpack_Core_Json_Api_Endpoints::set_subscriber_cookie_and_redirect( $request );

		$this->assertInstanceOf( 'WP_Error', $response, 'A protocol-relative redirect target must be rejected.' );
		$this->assertSame( 'invalid-redirect', $response->get_error_code() );
	}

	/**
	 * A redirect to the site's own host is still allowed.
	 */
	public function test_subscriber_auth_allows_same_host_redirect() {
		$this->load_rest_endpoints_direct();
		$this->mock_valid_subscriber_token();

		$redirect_url = home_url( '/?p=123' );
		$request      = new WP_REST_Request( 'GET', '/jetpack/v4/subscribers/auth' );
		$request->set_param( 'redirect_url', $redirect_url );

		$response = Jetpack_Core_Json_Api_Endpoints::set_subscriber_cookie_and_redirect( $request );

		$this->assertInstanceOf( 'WP_REST_Response', $response, 'A same-host redirect target must be allowed.' );
		$this->assertSame( 302, $response->get_status() );
		$headers = $response->get_headers();
		$this->assertSame( $redirect_url, $headers['location'] );
	}

	/**
	 * A backslash-obfuscated host (https:/\attacker.example) must also be rejected.
	 * Browsers can normalize backslashes to forward slashes, so this is a known
	 * open-redirect bypass class; wp_validate_redirect() strips the backslash and
	 * the result no longer resolves to an allowed host.
	 */
	public function test_subscriber_auth_rejects_backslash_redirect() {
		$this->load_rest_endpoints_direct();
		$this->mock_valid_subscriber_token();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/subscribers/auth' );
		$request->set_param( 'redirect_url', 'https:/\\attacker.example/phishing' );

		$response = Jetpack_Core_Json_Api_Endpoints::set_subscriber_cookie_and_redirect( $request );

		$this->assertInstanceOf( 'WP_Error', $response, 'A backslash-obfuscated redirect target must be rejected.' );
		$this->assertSame( 'invalid-redirect', $response->get_error_code() );
	}

	/**
	 * An invalid/expired subscriber token must be rejected before any redirect,
	 * and must surface as an HTTP 403 rather than a server error. Guards the
	 * inverted token branch introduced alongside the NL-761 open-redirect fix.
	 */
	public function test_subscriber_auth_rejects_invalid_token() {
		$this->load_rest_endpoints_direct();
		require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';

		add_filter(
			'earn_premium_content_subscription_service',
			static function () {
				return new class() extends \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Jetpack_Token_Subscription_Service {
					public function get_and_set_token_from_request() {
						return 'invalid-token';
					}
					public function decode_token( $token ) {
						// Only a 'valid-token' decodes; anything else is treated as invalid/expired.
						return 'valid-token' === $token ? array( 'blog_id' => 123 ) : null;
					}
				};
			},
			99
		);

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/subscribers/auth' );
		$request->set_param( 'redirect_url', home_url( '/?p=123' ) );

		$response = Jetpack_Core_Json_Api_Endpoints::set_subscriber_cookie_and_redirect( $request );

		$this->assertInstanceOf( 'WP_Error', $response, 'An invalid token must be rejected.' );
		$this->assertSame( 'invalid-token', $response->get_error_code() );
		$error_data = $response->get_error_data();
		$this->assertSame( 403, $error_data['status'], 'An invalid token must surface as an HTTP 403.' );
	}
} // class end

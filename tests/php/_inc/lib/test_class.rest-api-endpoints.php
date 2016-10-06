<?php
/**
 * Class for REST API endpoints testing.
 *
 * @since 4.4.0
 */
class WP_Test_Jetpack_REST_API_endpoints extends WP_UnitTestCase {

	/**
	 * Setup environment for REST API endpoints test.
	 *
	 * @since 4.4.0
	 */
	public function setUp() {

		parent::setUp();

		require_once dirname( __FILE__ ) . '/../../../../_inc/lib/class.core-rest-api-endpoints.php';
	}

	/**
	 * Test permission to see if users can view Jetpack admin screen.
	 *
	 * @since 4.4.0
	 */
	public function test_jetpack_admin_page() {

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
	public function test_manage_configure_modules_permission_check() {

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
	 * Get Jetpack connection status.
	 *
	 * @since 4.4.0
	 *
	 * @return array
	 */
	private function get_jetpack_connection_status() {
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
	 * @return array
	 */
	private function create_and_get_user( $role = '' ) {
		return $this->factory->user->create_and_get( array(
			'role' => empty( $role ) ? 'subscriber' : $role,
		) );
	}

	/**
	 * Test information about connection status.
	 *
	 * @since 4.4.0
	 */
	public function test_jetpack_connection_status() {

		// Create a user
		$user = $this->create_and_get_user( 'administrator' );

		// Mock a connection
		Jetpack_Options::update_option( 'master_user', $user->ID );
		Jetpack_Options::update_option( 'user_tokens', array( $user->ID => "honey.badger.$user->ID" ) );

		// Fetch connection status data
		$status = $this->get_jetpack_connection_status();

		// Site is connected and not in Dev Mode
		$this->assertTrue( $status['isActive'] );
		$this->assertFalse( $status['isStaging'] );
		$this->assertFalse( $status['devMode']['isActive'] );

		// Test in Staging Mode
		add_filter( 'jetpack_is_staging_site', '__return_true' );

		// Fetch connection status data
		$status = $this->get_jetpack_connection_status();

		$this->assertTrue( $status['isStaging'] );

		remove_filter( 'jetpack_is_staging_site', '__return_true' );

		// Test also in Dev Mode
		add_filter( 'jetpack_development_mode', '__return_true' );

		// Fetch connection status data again
		$status = $this->get_jetpack_connection_status();

		// Site is still connected! But is now also in Dev Mode
		$this->assertTrue( $status['isActive'] );
		$this->assertTrue( $status['devMode']['isActive'] );

		// Disconnecting now
		Jetpack::disconnect( true );

		// Fetch connection status data one more time
		$status = $this->get_jetpack_connection_status();

		// Site is disconnected now
		$this->assertFalse( $status['isActive'] );

		remove_filter( 'jetpack_development_mode', '__return_true' );
	}

} // class end
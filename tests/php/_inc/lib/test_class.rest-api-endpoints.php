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
	 * Test permission to connect Jetpack site or link user.
	 *
	 * @since 4.4.0
	 */
	public function test_connection_permission() {

		// Current user doesn't have credentials, so checking permissions should fail
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::link_user_permission_callback() );
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::get_user_connection_data_permission_callback() );

		// Setup a new current user with specified capability
		$user = $this->factory->user->create_and_get( array(
			'user_login' => 'user_connect_url',
			'user_pass'  => 'password_connect_url',
		) );

		// Add Jetpack capability
		$user->add_cap( 'jetpack_connect_user' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// User has capability so this should work this time
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::link_user_permission_callback() );
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::get_user_connection_data_permission_callback() );

		// It should not work in Dev Mode
		add_filter( 'jetpack_development_mode', '__return_true' );

		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::connect_url_permission_callback() );
		$this->assertInstanceOf( 'WP_Error', Jetpack_Core_Json_Api_Endpoints::link_user_permission_callback() );
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

		$user = $this->factory->user->create_and_get( array(
			'user_login' => 'user_disconnect_url',
			'user_pass'  => 'password_disconnect_url',
			'role' 		 => 'administrator',
		) );

		// Add Jetpack capability
		$user->add_cap( 'jetpack_disconnect' );

		// Setup global variables so this is the current user
		wp_set_current_user( $user->ID );

		// User has capability so this should work this time
		$this->assertTrue( Jetpack_Core_Json_Api_Endpoints::disconnect_site_permission_callback() );

	}

} // class end
<?php

class WP_Test_Jetpack_Client_Server extends WP_UnitTestCase {

	public function setUp() {
		self::$ignore_files = TRUE;

		parent::setUp();
	}

	/**
	 * @author scotchfield
	 * @since 3.2
	 */
	public function test_jetpack_client_server_initialize() {
		$client_server = new Jetpack_Client_Server;

		$this->assertNotNull( $client_server );
	}

	/**
	 * @author scotchfield
	 * @runInSeparateProcess
	 * @covers Jetpack_Client_Server::authorize
	 * @since 3.2
	 */
	public function test_jetpack_client_server_authorize_role_cap() {
		$author_id = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		wp_set_current_user( $author_id );

		$client_server = $this->getMock(
			'Jetpack_Client_Server',
			array( 'check_admin_referer', 'wp_safe_redirect', 'do_exit' )
		);

		$client_server->authorize();

		$this->assertNotEquals( 'no_role', Jetpack::state( 'error' ) );
		$this->assertNotEquals( 'no_cap', Jetpack::state( 'error' ) );
	}

	/**
	 * @author scotchfield
	 * @runInSeparateProcess
	 * @covers Jetpack_Client_Server::authorize
	 * @since 3.2
	 */
	public function test_jetpack_client_server_authorize_no_role() {
		$author_id = $this->factory->user->create( array(
			'role' => 'imagination_mover',
		) );
		wp_set_current_user( $author_id );

		$client_server = $this->getMock(
			'Jetpack_Client_Server',
			array( 'check_admin_referer', 'wp_safe_redirect', 'do_exit' )
		);

		$client_server->authorize();

		$this->assertEquals( 'no_role', Jetpack::state( 'error' ) );
	}

	/**
	 * @author scotchfield
	 * @runInSeparateProcess
	 * @covers Jetpack_Client_Server::authorize
	 * @since 3.2
	 */
	public function test_jetpack_client_server_authorize_data_error() {
		$author_id = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		wp_set_current_user( $author_id );

		$client_server = $this->getMock(
			'Jetpack_Client_Server',
			array( 'check_admin_referer', 'wp_safe_redirect', 'do_exit' )
		);

		$data_error = 'test_error';
		$_GET[ 'error' ] = $data_error;

		$client_server->authorize();

		$this->assertEquals( $data_error, Jetpack::state( 'error' ) );
	}

	/**
	 * @author scotchfield
	 * @runInSeparateProcess
	 * @covers Jetpack_Client_Server::deactivate_plugin
	 * @since 3.2
	 */
	public function test_jetpack_client_server_deactivate_plugin() {
		$client_server = new Jetpack_Client_Server;

		$return_value = $client_server->deactivate_plugin( 'herp', 'derp' );

		$this->assertEquals( $return_value, 0 );
	}

	/**
	 * @author scotchfield
	 * @runInSeparateProcess
	 * @covers Jetpack_Client_Server::get_token
	 * @since 3.2
	 */
	public function test_jetpack_client_server_get_token() {
		$author_id = $this->factory->user->create( array(
			'role' => 'administrator',
		) );
		wp_set_current_user( $author_id );

		$client_server = new Jetpack_Client_Server;

		$return_value = $client_server->get_token( 'test' );

		$this->assertInstanceOf( 'Jetpack_Error', $return_value );
	}

}

<?php

class WP_Test_Jetpack_Client_Server extends WP_UnitTestCase {

	static public function setUpBeforeClass() {
		parent::setUpBeforeClass();
		self::$ignore_files = TRUE;
	}

	public function setUp() {
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

		$client_server = $this->getMockBuilder( 'Jetpack_Client_Server' )
			->setMethods( array( 'do_exit' ) )
			->getMock();

		$result = $client_server->authorize();

		$this->assertNotEquals( 'no_role', $result->get_error_code() );
		$this->assertNotEquals( 'no_cap', $result->get_error_code() );
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

		$client_server = $this->getMockBuilder( 'Jetpack_Client_Server' )
			->setMethods( array( 'do_exit' ) )
			->getMock();

		$result = $client_server->authorize();

		$this->assertEquals( 'no_role', $result->get_error_code() );
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

		$client_server = $this->getMockBuilder( 'Jetpack_Client_Server' )
			->setMethods( array( 'do_exit' ) )
			->getMock();

		$result = $client_server->authorize( array( 'error' => 'test_error' ) );

		$this->assertEquals( 'test_error', $result->get_error_code() );
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

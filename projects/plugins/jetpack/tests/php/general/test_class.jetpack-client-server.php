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
	 * @covers Jetpack_Client_Server
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

		$result = Jetpack::connection()->authorize();

		$this->assertNotEquals( 'no_role', $result->get_error_code() );
		$this->assertNotEquals( 'no_cap', $result->get_error_code() );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Client_Server
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

		$result = Jetpack::connection()->authorize();

		$this->assertEquals( 'no_role', $result->get_error_code() );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Client_Server
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

		$result = Jetpack::connection()->authorize( array( 'error' => 'test_error' ) );

		$this->assertEquals( 'test_error', $result->get_error_code() );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Client_Server
	 * @since 3.2
	 */
	public function test_jetpack_client_server_deactivate_plugin() {
		$client_server = new Jetpack_Client_Server;

		$return_value = $client_server->deactivate_plugin( 'herp', 'derp' );

		$this->assertEquals( $return_value, 0 );
	}

	/**
	 * @author scotchfield
	 * @covers Jetpack_Client_Server
	 * @since 3.2
	 */
	public function test_jetpack_client_server_get_token() {
		$author_id = $this->factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		wp_set_current_user( $author_id );

		$return_value = Jetpack::connection()->get_token( 'test' );

		$this->assertInstanceOf( 'WP_Error', $return_value );
	}

}

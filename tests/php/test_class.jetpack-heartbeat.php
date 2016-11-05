<?php

class WP_Test_Jetpack_Heartbeat extends WP_UnitTestCase {

	/**
	 * @covers Jetpack_Heartbeat::init
	 * @since 3.9.0
	 */
	public function test_init() {
		$this->assertInstanceOf( 'Jetpack_Heartbeat', Jetpack_Heartbeat::init() );
	}

	public function jetpack_heartbeat() {
		$this->heartbeat_action = true;
	}

	/**
	 * @covers Jetpack_Heartbeat::cron_exec
	 * @since 3.9.0
	 */
	public function test_cron_exec() {
		$this->heartbeat_action = false;
		add_action( 'jetpack_heartbeat', array( $this, 'jetpack_heartbeat' ) );

		Jetpack_Heartbeat::init()->cron_exec();

		$this->assertTrue( $this->heartbeat_action );
	}

	/**
	 * @covers Jetpack_Heartbeat::generate_stats_array
	 * @since 3.9.0
	 */
	public function test_generate_stats_array() {
		$prefix = 'test';

		$result = Jetpack_Heartbeat::generate_stats_array( $prefix );

		$this->assertNotEmpty( $result );
		$this->assertArrayHasKey( $prefix . 'version', $result );
	}

	/**
	 * @covers Jetpack_Heartbeat::jetpack_xmlrpc_methods
	 * @since 3.9.0
	 */
	public function test_jetpack_xmlrpc_methods() {
		$this->assertNotEmpty( Jetpack_Heartbeat::jetpack_xmlrpc_methods( array() ) );
	}

}

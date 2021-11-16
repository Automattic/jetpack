<?php

class WP_Test_Jetpack_Heartbeat extends WP_UnitTestCase {

	/**
	 * @covers Jetpack_Heartbeat::init
	 * @since 3.9.0
	 */
	public function test_init() {
		$this->assertInstanceOf( 'Jetpack_Heartbeat', Jetpack_Heartbeat::init() );
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
}

<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Automattic\Jetpack\Tracking methods
 *
 * @package automattic/jetpack-tracking
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\TestCase;

/**
 * Tracking test suite.
 */
class Test_Tracking extends TestCase {

	/**
	 * Test setup.
	 */
	public function setUp() {
		$this->connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->setMethods( array( 'is_user_connected' ) )
			->getMock();
		$this->tracking   = new Tracking( 'jetpack', $this->connection );
	}

	/**
	 * Tests the  Automattic\Jetpack\Tracking::should_enabled_tracking() method.
	 *
	 * @param array   $inputs The test input values.
	 * @param boolean $expected_output The expected output of Automattic\Jetpack\Tracking::should_enabled_tracking().
	 *
	 * @covers Automattic\Jetpack\Tracking::should_enabled_tracking
	 * @dataProvider data_provider_test_should_enable_tracking
	 */
	public function test_should_enable_tracking( $inputs, $expected_output ) {
		$tos = $this->getMockBuilder( 'Automattic\Jetpack\Terms_Of_Service' )
			->setMethods( array( 'has_agreed' ) )
			->getMock();

		$tos->method( 'has_agreed' )
			->will( $this->returnValue( $inputs['has_agreed'] ) );

		$status = $this->getMockBuilder( 'Automattic\Jetpack\Status' )
			->setMethods( array( 'is_offline_mode' ) )
			->getMock();

		$status->method( 'is_offline_mode' )
			->will( $this->returnValue( $inputs['offline'] ) );

		$this->connection->method( 'is_user_connected' )
			->will( $this->returnValue( $inputs['connected'] ) );

		$this->assertEquals( $expected_output, $this->tracking->should_enable_tracking( $tos, $status ) );
	}

	/**
	 * Data provider for test_should_enable_tracking.
	 *
	 * @return array
	 */
	public function data_provider_test_should_enable_tracking() {
		return array(
			'offline: true, has agreed: true, connected: true' => array(
				array(
					'offline'    => true,
					'has_agreed' => true,
					'connected'  => true,
				),
				false,
			),
			'offline: false, has agreed: true, connected: true' => array(
				array(
					'offline'    => false,
					'has_agreed' => true,
					'connected'  => true,
				),
				true,
			),
			'offline: false, has agreed: true, connected: false' => array(
				array(
					'offline'    => false,
					'has_agreed' => true,
					'connected'  => false,
				),
				true,
			),
			'offline: false, has agreed: false, connected: true' => array(
				array(
					'offline'    => false,
					'has_agreed' => false,
					'connected'  => true,
				),
				true,
			),
			'offline: false, has agreed: false, connected: false' => array(
				array(
					'offline'    => false,
					'has_agreed' => false,
					'connected'  => false,
				),
				false,
			),
		);
	}
}

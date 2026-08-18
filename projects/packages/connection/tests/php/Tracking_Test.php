<?php
/**
 * Tests for Automattic\Jetpack\Tracking methods
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Tracking test suite.
 *
 * @covers \Automattic\Jetpack\Tracking
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */]
#[CoversClass( Tracking::class )]
class Tracking_Test extends TestCase {

	/**
	 * Connection manager mock object.
	 *
	 * @var \Automattic\Jetpack\Connection\Manager
	 */
	public $connection;

	/**
	 * Tracking object.
	 *
	 * @var Tracking
	 */
	public $tracking;

	/**
	 * Test setup.
	 */
	public function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		$this->connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->onlyMethods( array( 'is_user_connected' ) )
			->getMock();
		$this->tracking   = new Tracking( 'jetpack', $this->connection );
	}

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		parent::tearDown();
		Monkey\tearDown();
	}

	/**
	 * Tests the  Automattic\Jetpack\Tracking::should_enable_tracking() method.
	 *
	 * @param array   $inputs The test input values.
	 * @param boolean $expected_output The expected output of Automattic\Jetpack\Tracking::should_enable_tracking().
	 *
	 * @dataProvider data_provider_test_should_enable_tracking
	 */
	#[DataProvider( 'data_provider_test_should_enable_tracking' )]
	public function test_should_enable_tracking( $inputs, $expected_output ) {
		$tos = $this->getMockBuilder( 'Automattic\Jetpack\Terms_Of_Service' )
			->onlyMethods( array( 'has_agreed' ) )
			->getMock();

		$tos->method( 'has_agreed' )
			->willReturn( $inputs['has_agreed'] );

		$status = $this->getMockBuilder( 'Automattic\Jetpack\Status' )
			->onlyMethods( array( 'is_offline_mode' ) )
			->getMock();

		$status->method( 'is_offline_mode' )
			->willReturn( $inputs['offline'] );

		$this->connection->method( 'is_user_connected' )
			->willReturn( $inputs['connected'] );

		$this->assertEquals( $expected_output, $this->tracking->should_enable_tracking( $tos, $status ) );
	}

	/**
	 * Data provider for test_should_enable_tracking.
	 *
	 * @return array
	 */
	public static function data_provider_test_should_enable_tracking() {
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

	/**
	 * Tests that the Tracks nonce is unslashed and sanitized before it is verified.
	 *
	 * Nonce verification is pluggable, so the value handed to wp_verify_nonce() has to be
	 * cleaned first.
	 *
	 * @param string $raw      Raw $_REQUEST value.
	 * @param string $expected Value wp_verify_nonce() is expected to receive.
	 * @dataProvider data_provider_test_nonce_is_sanitized
	 */
	#[DataProvider( 'data_provider_test_nonce_is_sanitized' )]
	public function test_ajax_tracks_sanitizes_the_nonce( $raw, $expected ) {
		$received = null;
		Functions\when( 'wp_verify_nonce' )->alias(
			function ( $nonce ) use ( &$received ) {
				$received = $nonce;
				return false;
			}
		);
		Functions\when( 'wp_send_json_error' )->alias(
			function () {
				throw new \RuntimeException( 'wp_send_json_error' );
			}
		);

		$_REQUEST['tracksNonce'] = $raw;

		try {
			$this->tracking->ajax_tracks();
		} catch ( \RuntimeException $e ) {
			unset( $e );
		}

		unset( $_REQUEST['tracksNonce'] );

		$this->assertSame( $expected, $received );
	}

	/**
	 * Data provider for 'test_ajax_tracks_sanitizes_the_nonce'.
	 *
	 * @return array
	 */
	public static function data_provider_test_nonce_is_sanitized() {
		return array(
			'a real nonce is unchanged' => array( 'a1b2c3d4e5', 'a1b2c3d4e5' ),
			'markup is stripped'        => array( '<b>a1b2c3d4e5</b>', 'a1b2c3d4e5' ),
			'whitespace is trimmed'     => array( "  a1b2c3d4e5\n", 'a1b2c3d4e5' ),
			'slashes are removed'       => array( "a1b2\\'c3d4", "a1b2'c3d4" ),
		);
	}

	/**
	 * Tests that sanitizing the nonce does not stop a valid one from verifying.
	 *
	 * The handler bails on the event name rather than the nonce, which only happens once
	 * nonce verification has passed.
	 */
	public function test_ajax_tracks_still_accepts_a_valid_nonce() {
		$message = null;
		Functions\when( 'wp_send_json_error' )->alias(
			function ( $error ) use ( &$message ) {
				$message = $error;
				throw new \RuntimeException( 'wp_send_json_error' );
			}
		);

		$_REQUEST['tracksNonce'] = wp_create_nonce( 'jp-tracks-ajax-nonce' );

		try {
			$this->tracking->ajax_tracks();
		} catch ( \RuntimeException $e ) {
			unset( $e );
		}

		unset( $_REQUEST['tracksNonce'] );

		$this->assertSame( 'No valid event name or type.', $message );
	}
}

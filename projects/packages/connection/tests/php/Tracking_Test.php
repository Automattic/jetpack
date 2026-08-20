<?php
/**
 * Tests for Automattic\Jetpack\Tracking methods
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
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

		// External_Storage, reached through Jetpack_Options, computes a class constant from this
		// at load time. Brain Monkey tests run without the WordPress constants defined.
		if ( ! defined( 'MINUTE_IN_SECONDS' ) ) {
			define( 'MINUTE_IN_SECONDS', 60 );
		}

		$this->connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->onlyMethods( array( 'is_user_connected' ) )
			->getMock();
		$this->tracking   = new Tracking( 'jetpack', $this->connection );
	}

	/**
	 * Test teardown.
	 */
	public function tearDown(): void {
		unset( $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_USER_AGENT'], $_SERVER['HTTP_ACCEPT_LANGUAGE'] );
		unset(
			$_REQUEST['tracksNonce'],
			$_REQUEST['tracksEventName'],
			$_REQUEST['tracksEventType'],
			$_REQUEST['tracksEventProp']
		);

		parent::tearDown();
		Monkey\tearDown();
	}

	/**
	 * Build a Tracking object that captures the properties it would send to Tracks.
	 *
	 * @param array $captured Set by reference to the properties passed to tracks_record_event().
	 * @return Tracking
	 */
	private function tracking_capturing_properties( &$captured ) {
		Monkey\Functions\when( 'wp_unslash' )->returnArg();
		Monkey\Functions\when( 'get_option' )->alias(
			function ( $option ) {
				return 'siteurl' === $option ? 'https://example.com' : false;
			}
		);

		$tracking = $this->getMockBuilder( Tracking::class )
			->setConstructorArgs( array( 'jetpack', $this->connection ) )
			->onlyMethods( array( 'tracks_record_event' ) )
			->getMock();

		$tracking->method( 'tracks_record_event' )
			->willReturnCallback(
				function ( $user, $event_name, $properties ) use ( &$captured ) {
					$captured = $properties;
					return true;
				}
			);

		return $tracking;
	}

	/**
	 * REMOTE_ADDR is normalized and then validated as an IP address, so a decorated address is
	 * reduced to the address itself and anything that is not one is sent as an empty string
	 * rather than passed through verbatim.
	 *
	 * @param string $remote_addr The REMOTE_ADDR value the request arrives with.
	 * @param string $expected    The value expected in the Tracks `_via_ip` property.
	 *
	 * @dataProvider data_provider_test_via_ip_is_validated
	 */
	#[DataProvider( 'data_provider_test_via_ip_is_validated' )]
	public function test_via_ip_is_validated( $remote_addr, $expected ) {
		$captured = array();
		$tracking = $this->tracking_capturing_properties( $captured );

		$_SERVER['REMOTE_ADDR'] = $remote_addr;

		$tracking->record_user_event( 'test_event', array(), 'test_user' );

		$this->assertSame( $expected, $captured['_via_ip'] );
	}

	/**
	 * Data provider for test_via_ip_is_validated.
	 *
	 * @return array
	 */
	public static function data_provider_test_via_ip_is_validated() {
		return array(
			'IPv4'                     => array( '203.0.113.5', '203.0.113.5' ),
			'IPv6'                     => array( '2001:db8::1', '2001:db8::1' ),
			'IPv6 in upper case'       => array( '2001:DB8::1', '2001:db8::1' ),
			'surrounding whitespace'   => array( "  203.0.113.5\n", '203.0.113.5' ),
			'IPv4 with a port'         => array( '192.0.2.1:54321', '192.0.2.1' ),
			'bracketed IPv6'           => array( '[2001:db8::1]', '2001:db8::1' ),
			'bracketed IPv6 with port' => array( '[2001:db8::1]:54321', '2001:db8::1' ),
			'IPv4 mapped into IPv6'    => array( '::ffff:203.0.113.5', '203.0.113.5' ),
			'IPv6 with a zone index'   => array( 'fe80::1%eth0', '' ),
			'list from a front proxy'  => array( '203.0.113.5, 198.51.100.2', '' ),
			'not an address at all'    => array( '<script>alert(1)</script>', '' ),
		);
	}

	/**
	 * The user agent and the language are free-form strings, so they are sanitized rather than
	 * validated. The IP address is deliberately excluded, being validated instead.
	 */
	public function test_user_agent_and_language_are_sanitized() {
		$captured = array();
		$tracking = $this->tracking_capturing_properties( $captured );

		Monkey\Functions\when( 'sanitize_text_field' )->alias(
			function ( $str ) {
				return 'sanitized:' . $str;
			}
		);

		$_SERVER['HTTP_USER_AGENT']      = 'Mozilla/5.0';
		$_SERVER['HTTP_ACCEPT_LANGUAGE'] = 'en-US,en;q=0.9';
		$_SERVER['REMOTE_ADDR']          = '203.0.113.5';

		$tracking->record_user_event( 'test_event', array(), 'test_user' );

		$this->assertSame( 'sanitized:Mozilla/5.0', $captured['_via_ua'] );
		$this->assertSame( 'sanitized:en-US,en;q=0.9', $captured['_lg'] );
		$this->assertSame( '203.0.113.5', $captured['_via_ip'] );
	}

	/**
	 * Absent request metadata is reported as an empty string, not as a missing property.
	 */
	public function test_absent_request_metadata_is_empty() {
		$captured = array();
		$tracking = $this->tracking_capturing_properties( $captured );

		$tracking->record_user_event( 'test_event', array(), 'test_user' );

		$this->assertSame( '', $captured['_via_ua'] );
		$this->assertSame( '', $captured['_via_ip'] );
		$this->assertSame( '', $captured['_lg'] );
	}

	/**
	 * Build a Tracking object that captures what ajax_tracks() forwards to record_user_event(),
	 * with the WordPress functions that method reaches stubbed out.
	 *
	 * The two sanitizers return distinguishable markers so a test can assert which of them guards a
	 * given field. map_deep() is given a real recursive implementation, since the point of using it
	 * is that it reaches nested values.
	 *
	 * @param string|null $event_name Set by reference to the event name passed on.
	 * @param array|null  $properties Set by reference to the properties passed on.
	 * @return Tracking
	 */
	private function tracking_capturing_ajax_event( &$event_name, &$properties ) {
		Monkey\Functions\when( 'wp_unslash' )->returnArg();
		Monkey\Functions\when( 'wp_verify_nonce' )->justReturn( true );
		Monkey\Functions\when( 'wp_send_json_error' )->justReturn( null );
		Monkey\Functions\when( 'wp_send_json_success' )->justReturn( null );
		Monkey\Functions\when( 'sanitize_key' )->alias(
			function ( $str ) {
				return 'key:' . $str;
			}
		);
		Monkey\Functions\when( 'sanitize_text_field' )->alias(
			function ( $str ) {
				return 'text:' . $str;
			}
		);

		$deep = function ( $value, $callback ) use ( &$deep ) {
			if ( is_array( $value ) ) {
				return array_map(
					function ( $item ) use ( &$deep, $callback ) {
						return $deep( $item, $callback );
					},
					$value
				);
			}
			return $callback( $value );
		};
		Monkey\Functions\when( 'map_deep' )->alias( $deep );

		$tracking = $this->getMockBuilder( Tracking::class )
			->setConstructorArgs( array( 'jetpack', $this->connection ) )
			->onlyMethods( array( 'record_user_event' ) )
			->getMock();

		$tracking->method( 'record_user_event' )
			->willReturnCallback(
				function ( $name, $data = array() ) use ( &$event_name, &$properties ) {
					$event_name = $name;
					$properties = $data;
					return true;
				}
			);

		return $tracking;
	}

	/**
	 * The event name reaches Tracks as a key, so it is sanitized with sanitize_key() rather than
	 * passed through. Tracks itself only accepts lowercase alphanumerics and underscores.
	 */
	public function test_ajax_tracks_sanitizes_the_event_name() {
		$event_name = null;
		$properties = null;
		$tracking   = $this->tracking_capturing_ajax_event( $event_name, $properties );

		$_REQUEST['tracksNonce']     = 'nonce';
		$_REQUEST['tracksEventName'] = 'jetpack_about_click';
		$_REQUEST['tracksEventType'] = 'view';

		$tracking->ajax_tracks();

		$this->assertSame( 'key:jetpack_about_click', $event_name );
	}

	/**
	 * A scalar event property is sanitized as free-form text before it is recorded.
	 */
	public function test_ajax_tracks_sanitizes_a_scalar_event_prop() {
		$event_name = null;
		$properties = null;
		$tracking   = $this->tracking_capturing_ajax_event( $event_name, $properties );

		$_REQUEST['tracksNonce']     = 'nonce';
		$_REQUEST['tracksEventName'] = 'jetpack_about_click';
		$_REQUEST['tracksEventType'] = 'click';
		$_REQUEST['tracksEventProp'] = '<script>alert(1)</script>';

		$tracking->ajax_tracks();

		$this->assertSame( array( 'clicked' => 'text:<script>alert(1)</script>' ), $properties );
	}

	/**
	 * Array event properties are sanitized at every depth. The request is client-supplied, so it
	 * can nest even though the shipped JavaScript client only sends a flat object.
	 */
	public function test_ajax_tracks_sanitizes_array_event_props_at_any_depth() {
		$event_name = null;
		$properties = null;
		$tracking   = $this->tracking_capturing_ajax_event( $event_name, $properties );

		$_REQUEST['tracksNonce']     = 'nonce';
		$_REQUEST['tracksEventName'] = 'jetpack_about_click';
		$_REQUEST['tracksEventType'] = 'click';
		$_REQUEST['tracksEventProp'] = array(
			'feature' => 'backups',
			'nested'  => array( 'inner' => 'value' ),
		);

		$tracking->ajax_tracks();

		$this->assertSame(
			array(
				'feature' => 'text:backups',
				'nested'  => array( 'inner' => 'text:value' ),
			),
			$properties
		);
	}

	/**
	 * Properties are only collected for click events, so another event type records none.
	 */
	public function test_ajax_tracks_ignores_props_for_non_click_events() {
		$event_name = null;
		$properties = null;
		$tracking   = $this->tracking_capturing_ajax_event( $event_name, $properties );

		$_REQUEST['tracksNonce']     = 'nonce';
		$_REQUEST['tracksEventName'] = 'jetpack_about_click';
		$_REQUEST['tracksEventType'] = 'view';
		$_REQUEST['tracksEventProp'] = 'ignored';

		$tracking->ajax_tracks();

		$this->assertSame( array(), $properties );
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
}

<?php
/**
 * Test file for Dashboard_Switcher_Tracking
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Dashboard_Switcher_Tracking;
use Automattic\Jetpack\Tracking;

require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/admin-menu/class-dashboard-switcher-tracking.php';

/**
 * Class Test_Dashboard_Switcher_Tracking
 *
 * @coversDefaultClass Dashboard_Switcher_Tracking
 */
class Test_Dashboard_Switcher_Tracking extends \WP_UnitTestCase {
	/**
	 * Mock user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Whether this testsuite is run on WP.com.
	 *
	 * @var bool
	 */
	public static $is_wpcom;

	/**
	 * Set up data.
	 */
	public function set_up() {
		parent::set_up();
		wp_set_current_user( static::$user_id );
	}

	/**
	 * Create shared fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Check if an event is triggered for Jetpack.
	 */
	public function test_it_creates_event_for_jetpack() {
		$tracking = $this->createMock( Tracking::class );

		$event_properties = array(
			'current_page' => 'foo',
			'destination'  => 'bar',
			'plan'         => 'business',
		);

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$event_properties['blog_id'] = get_current_blog_id();
		} else {
			// record_user_event only gets called outside WP.com.
			$tracking->expects( $this->once() )->method( 'record_user_event' )->with(
				Dashboard_Switcher_Tracking::JETPACK_EVENT_NAME,
				$event_properties
			);
		}

		$wpcom_tracks = function ( $properties ) use ( $event_properties ) {
			$this->assertEquals( $event_properties, $properties );
		};

		$dashboard_tracking = new Dashboard_Switcher_Tracking( $tracking, $wpcom_tracks, 'business' );

		$dashboard_tracking->record_switch_event( 'foo', 'bar' );
	}

	/**
	 * Check if an event is triggered for WPCOM.
	 */
	public function test_it_creates_event_for_wpcom() {
		if ( ! static::$is_wpcom ) {
			$this->markTestSkipped( 'Only used on WP.com.' );
		}

		$event_properties = array(
			'current_page' => 'foo',
			'destination'  => 'bar',
			'plan'         => 'business',
			'blog_id'      => 1,
		);

		$tracking = $this->createMock( Tracking::class );

		$wpcom_tracks = function ( $properties ) use ( $event_properties ) {
			$this->assertEquals( $event_properties, $properties );
		};

		$dashboard_tracking = new Dashboard_Switcher_Tracking( $tracking, $wpcom_tracks, 'business' );
		$dashboard_tracking->record_switch_event( 'foo', 'bar' );
	}
}

<?php
/**
 * Test file for Dashboard_Switcher_Tracking
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Tracking;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Class Test_Dashboard_Switcher_Tracking
 *
 * @covers Dashboard_Switcher_Tracking
 */
class Test_Dashboard_Switcher_Tracking extends TestCase {
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
	 * Set up each test.
	 *
	 * @before
	 */
	public function set_up() {
		static::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( static::$user_id );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
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

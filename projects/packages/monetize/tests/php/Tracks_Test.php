<?php
/**
 * Tests for the dashboard's Tracks setup.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Monetize\Tracks
 */
#[CoversClass( Tracks::class )]
class Tracks_Test extends BaseTestCase {

	/**
	 * Leave no query arg, option or script behind.
	 */
	public function tear_down() {
		unset( $_GET['page'] );
		Jetpack_Options::delete_option( 'tos_agreed' );
		wp_dequeue_script( 'jp-tracks' );
		parent::tear_down();
	}

	public function test_loads_on_the_dashboard_only_with_consent() {
		$_GET['page'] = Dashboard::MENU_SLUG;

		Tracks::enqueue_transport();
		$this->assertFalse( wp_script_is( 'jp-tracks', 'enqueued' ) );
		$this->assertFalse( Tracks::is_allowed() );

		Jetpack_Options::update_option( 'tos_agreed', true );
		Tracks::enqueue_transport();
		$this->assertTrue( wp_script_is( 'jp-tracks', 'enqueued' ) );
		$this->assertTrue( Tracks::is_allowed() );
	}
}

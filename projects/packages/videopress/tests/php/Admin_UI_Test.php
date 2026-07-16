<?php
/**
 * Tests for the Admin_UI modernization gate.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Tests that the modernization filter gates the wpcom Simple menu registration.
 */
class Admin_UI_Test extends BaseTestCase {

	/**
	 * Clean up the filter between tests.
	 */
	public function tearDown(): void {
		parent::tearDown();
		remove_all_filters( Admin_UI::MODERNIZATION_FILTER );
	}

	/**
	 * Test that is_modernized() defaults to enabled and follows the filter.
	 */
	public function test_is_modernized_follows_the_filter() {
		$this->assertTrue( Admin_UI::is_modernized() );

		add_filter( Admin_UI::MODERNIZATION_FILTER, '__return_false' );
		$this->assertFalse( Admin_UI::is_modernized() );
	}

	/**
	 * Test that the Simple submenu registration bails entirely when
	 * modernization is off (VIDP-285 staged rollout): no menu is registered,
	 * rather than a menu leading to the legacy dashboard, which is
	 * non-functional on Simple.
	 */
	public function test_add_wp_admin_submenu_bails_when_not_modernized() {
		global $submenu;
		$submenu = array();

		add_filter( Admin_UI::MODERNIZATION_FILTER, '__return_false' );
		Admin_UI::add_wp_admin_submenu();

		// The early return must fire before add_submenu_page() — with the flag
		// off, no submenu entry (and no load- hook) may exist.
		$this->assertSame( array(), $submenu );
	}
}

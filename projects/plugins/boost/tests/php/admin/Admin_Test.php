<?php

namespace Automattic\Jetpack_Boost\Tests\Admin;

use Automattic\Jetpack\Menu_Badges\Notification_Counts;
use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

if ( ! defined( 'JETPACK_BOOST_SLUG' ) ) {
	define( 'JETPACK_BOOST_SLUG', 'jetpack-boost' );
}

/**
 * Verifies that Admin::handle_admin_menu() reports the Boost problem count to
 * the central menu-badges registry, rather than hand-writing a menu-counter
 * span into the submenu label.
 */
class Admin_Test extends Base_TestCase {
	protected function set_up() {
		parent::set_up();

		Functions\when( '__' )->returnArg();

		// Boost only reports its count to users who can reach the menu; default the
		// capability to true so the registration path runs. Overridden per-test below.
		Functions\when( 'current_user_can' )->justReturn( true );

		// Start each test with a clean registry; other suites registering
		// under different ids don't matter here since we only assert on
		// the 'jetpack-boost' menu slug.
		Notification_Counts::reset();
	}

	protected function tear_down() {
		Notification_Counts::reset();
		parent::tear_down();
	}

	public function test_registers_zero_count_when_no_problems() {
		( new Admin() )->handle_admin_menu();

		$this->assertSame( 0, Notification_Counts::get_for_menu( JETPACK_BOOST_SLUG ) );
	}

	public function test_registers_filtered_problem_count() {
		// Only override the Boost problem-count filter; pass every other
		// apply_filters() call through unchanged (e.g. the registry's own
		// 'jetpack_menu_notification_counts' filter, invoked below via
		// Notification_Counts::get_for_menu()).
		Functions\when( 'apply_filters' )->alias(
			function ( $hook_name, $value = null ) {
				if ( 'jetpack_boost_total_problem_count' === $hook_name ) {
					return 3;
				}
				return $value;
			}
		);

		( new Admin() )->handle_admin_menu();

		$this->assertSame( 3, Notification_Counts::get_for_menu( JETPACK_BOOST_SLUG ) );
	}

	public function test_skips_registration_for_users_without_manage_options() {
		// A user who can't reach the Boost menu (added with 'manage_options') must not
		// contribute to the central menu-badges total.
		Functions\when( 'current_user_can' )->justReturn( false );

		( new Admin() )->handle_admin_menu();

		$this->assertSame( array(), Notification_Counts::all() );
	}
}

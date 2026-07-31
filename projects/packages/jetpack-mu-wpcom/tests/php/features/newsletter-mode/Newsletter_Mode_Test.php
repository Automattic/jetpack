<?php
/**
 * Tests for the Newsletter Mode page shell.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/newsletter-mode/class-newsletter-mode.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Newsletter_Mode
 */
#[CoversClass( Newsletter_Mode::class )]
class Newsletter_Mode_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'front' );
		delete_option( Newsletter_Mode::OPTION_ENABLED );
		remove_action( 'admin_menu', array( Newsletter_Mode::class, 'register_menu' ) );
		remove_action( 'toplevel_page_' . Newsletter_Mode::MENU_SLUG, '__return_empty_string' );
		wp_set_current_user( 0 );
		unset( $_GET['page'] );
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		delete_option( Newsletter_Mode::OPTION_ENABLED );
		remove_action( 'admin_menu', array( Newsletter_Mode::class, 'register_menu' ) );
		remove_action( 'toplevel_page_' . Newsletter_Mode::MENU_SLUG, '__return_empty_string' );
		wp_set_current_user( 0 );
		unset( $_GET['page'] );
		set_current_screen( 'front' );
		parent::tear_down();
	}

	/**
	 * Sites are not enrolled by default.
	 */
	public function test_is_disabled_by_default() {
		$this->assertFalse( Newsletter_Mode::is_enabled() );
	}

	/**
	 * The documented site option enrolls a site.
	 */
	public function test_site_option_enables_mode() {
		update_option( Newsletter_Mode::OPTION_ENABLED, 1 );

		$this->assertTrue( Newsletter_Mode::is_enabled() );
	}

	/**
	 * The emergency switch wins over per-site enrollment.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_emergency_constant_disables_enrolled_site() {
		define( Newsletter_Mode::DISABLE_CONSTANT, true );
		update_option( Newsletter_Mode::OPTION_ENABLED, 1 );

		$this->assertFalse( Newsletter_Mode::is_available() );
		$this->assertFalse( Newsletter_Mode::is_enabled() );
	}

	/**
	 * Disabled sites register no page hook.
	 */
	public function test_init_registers_no_hooks_when_disabled() {
		set_current_screen( 'dashboard' );

		Newsletter_Mode::init();

		$this->assertFalse( has_action( 'admin_menu', array( Newsletter_Mode::class, 'register_menu' ) ) );
	}

	/**
	 * Enrolled sites register the page hook.
	 */
	public function test_init_registers_menu_hook_when_enabled() {
		update_option( Newsletter_Mode::OPTION_ENABLED, 1 );
		set_current_screen( 'dashboard' );

		Newsletter_Mode::init();

		$this->assertSame( 10, has_action( 'admin_menu', array( Newsletter_Mode::class, 'register_menu' ) ) );
	}

	/**
	 * Enrolled sites register no hooks outside WP Admin.
	 */
	public function test_init_registers_no_hooks_outside_admin() {
		update_option( Newsletter_Mode::OPTION_ENABLED, 1 );

		Newsletter_Mode::init();

		$this->assertFalse( has_action( 'admin_menu', array( Newsletter_Mode::class, 'register_menu' ) ) );
	}

	/**
	 * Subscribers do not receive the Newsletter Mode menu entry.
	 */
	public function test_register_menu_requires_shell_capability() {
		update_option( Newsletter_Mode::OPTION_ENABLED, 1 );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'newsletter_mode_subscriber_' . wp_rand(),
				'user_pass'  => wp_generate_password(),
				'user_email' => 'newsletter-mode-subscriber-' . wp_rand() . '@example.com',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		Newsletter_Mode::register_menu();

		$this->assertFalse(
			has_action( 'toplevel_page_' . Newsletter_Mode::MENU_SLUG, '__return_empty_string' )
		);
	}

	/**
	 * Contributors do not receive the Newsletter Mode menu entry.
	 */
	public function test_register_menu_excludes_contributors() {
		update_option( Newsletter_Mode::OPTION_ENABLED, 1 );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'newsletter_mode_contributor_' . wp_rand(),
				'user_pass'  => wp_generate_password(),
				'user_email' => 'newsletter-mode-contributor-' . wp_rand() . '@example.com',
				'role'       => 'contributor',
			)
		);
		wp_set_current_user( $user_id );

		Newsletter_Mode::register_menu();

		$this->assertFalse(
			has_action( 'toplevel_page_' . Newsletter_Mode::MENU_SLUG, '__return_empty_string' )
		);
	}

	/**
	 * Authors receive the page with a safe fallback before build callbacks load.
	 */
	public function test_register_menu_allows_authors_with_fallback_callback() {
		update_option( Newsletter_Mode::OPTION_ENABLED, 1 );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'newsletter_mode_author_' . wp_rand(),
				'user_pass'  => wp_generate_password(),
				'user_email' => 'newsletter-mode-author-' . wp_rand() . '@example.com',
				'role'       => 'author',
			)
		);
		wp_set_current_user( $user_id );

		Newsletter_Mode::register_menu();

		$this->assertSame(
			10,
			has_action( 'toplevel_page_' . Newsletter_Mode::MENU_SLUG, '__return_empty_string' )
		);
	}
}

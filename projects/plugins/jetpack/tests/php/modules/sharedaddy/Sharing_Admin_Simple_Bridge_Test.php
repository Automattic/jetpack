<?php
/**
 * Tests for how the Sharing admin bootstrap registers Settings > Sharing on WordPress.com Simple.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing.php';

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sharing_Likes\Settings\Post_Handler;
use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * `load-jetpack.php` registers the screen everywhere else, but it does not run
 * on Simple: `post-flair.php` loads `sharing.php` alone, so that file has to
 * register the screen and its form handler itself there.
 *
 * @covers ::sharing_admin_init
 */
#[CoversFunction( 'sharing_admin_init' )]
class Sharing_Admin_Simple_Bridge_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Release the platform constant.
	 */
	public function tear_down() {
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Simple gets the screen and the handler that saves its forms.
	 */
	public function test_registers_the_screen_and_its_handler_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		sharing_admin_init();

		$this->assertSame( 10, has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
		$this->assertSame( 10, has_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) ) );
	}

	/**
	 * Elsewhere the plugin registers the screen once from `load-jetpack.php`,
	 * so this file must not add a second copy of the submenu.
	 */
	public function test_leaves_registration_to_the_plugin_elsewhere() {
		$before_menu    = has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) );
		$before_handler = has_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) );

		sharing_admin_init();

		$this->assertSame( $before_menu, has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
		$this->assertSame( $before_handler, has_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) ) );
	}
}

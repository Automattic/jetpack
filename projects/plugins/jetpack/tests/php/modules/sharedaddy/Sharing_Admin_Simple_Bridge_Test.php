<?php
/**
 * Tests for how the Sharing admin bootstrap sets the Sharing & Likes package up on WordPress.com Simple.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing.php';

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Sharing_Likes\Initializer;
use Automattic\Jetpack\Sharing_Likes\Settings\Post_Handler;
use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page;
use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * `load-jetpack.php` calls `Initializer::init()` everywhere else, but it does not
 * run on Simple: `post-flair.php` loads `sharing.php` alone, so that file has to
 * call it there.
 *
 * @covers ::sharing_admin_init
 */
#[CoversFunction( 'sharing_admin_init' )]
class Sharing_Admin_Simple_Bridge_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Start from a request on which nothing has set the package up yet.
	 *
	 * The test bootstrap runs `load-jetpack.php`, which already called `init()` once.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_initialized( false );
		remove_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) );
		remove_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) );
	}

	/**
	 * Release the platform constant, and leave the package initialized as the bootstrap did.
	 */
	public function tear_down() {
		Constants::clear_constants();
		set_current_screen( 'front' );
		remove_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) );
		remove_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) );
		$this->set_initialized( true );

		parent::tear_down();
	}

	/**
	 * Set the guard that makes `Initializer::init()` run once per request.
	 *
	 * @param bool $initialized Whether `init()` already ran.
	 */
	private function set_initialized( bool $initialized ): void {
		$property = new ReflectionProperty( Initializer::class, 'initialized' );
		// setAccessible() is a no-op as of PHP 8.1 and deprecated in 8.5; only needed on older versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $initialized );
	}

	/**
	 * Simple gets the screen and the handler that saves its forms, outside wp-admin too.
	 */
	public function test_registers_the_screen_and_its_handler_on_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		sharing_admin_init();

		$this->assertSame( 10, has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
		$this->assertSame( 10, has_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) ) );
	}

	/**
	 * Elsewhere `load-jetpack.php` sets the package up, so this file must not do it again.
	 */
	public function test_leaves_registration_to_the_plugin_elsewhere() {
		set_current_screen( 'dashboard' );

		sharing_admin_init();

		$this->assertFalse( has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
		$this->assertFalse( has_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) ) );
	}
}

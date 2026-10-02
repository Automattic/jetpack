<?php
/**
 * Tests for the package initializer.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes;

use Automattic\Jetpack\Sharing_Likes\REST\Endpoints;
use Automattic\Jetpack\Sharing_Likes\Settings\Post_Handler;
use Automattic\Jetpack\Sharing_Likes\Settings\Settings_Page;
use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionProperty;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Sharing_Likes\Initializer
 */
#[CoversClass( Initializer::class )]
class Initializer_Test extends BaseTestCase {

	/**
	 * Start every case uninitialized, outside wp-admin.
	 */
	public function set_up() {
		parent::set_up();

		$this->forget_initialization();
	}

	/**
	 * Leave no hooks, screen or initialization behind.
	 */
	public function tear_down() {
		unset( $GLOBALS['current_screen'] );
		remove_all_actions( 'rest_api_init' );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'admin_init' );
		$this->forget_initialization();

		parent::tear_down();
	}

	/**
	 * Reset the guard that makes `init()` run once per request.
	 */
	private function forget_initialization(): void {
		$property = new ReflectionProperty( Initializer::class, 'initialized' );
		// setAccessible() is a no-op as of PHP 8.1 and deprecated in 8.5; only needed on older versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );
	}

	/**
	 * Make `is_admin()` true, as it is for any request to a wp-admin screen.
	 */
	private function given_wp_admin(): void {
		$GLOBALS['current_screen'] = new class() {
			/**
			 * Whether the screen is in wp-admin.
			 */
			public function in_admin(): bool {
				return true;
			}
		};
	}

	public function test_package_version_is_a_version_string(): void {
		$this->assertMatchesRegularExpression( '/^\d+\.\d+\.\d+/', Initializer::PACKAGE_VERSION );
	}

	/**
	 * REST requests are not admin requests, so the routes register everywhere.
	 */
	public function test_registers_the_rest_routes_outside_wp_admin(): void {
		Initializer::init();

		$this->assertNotFalse( has_action( 'rest_api_init', array( Endpoints::class, 'register_routes' ) ) );
	}

	public function test_leaves_the_screen_out_of_requests_outside_wp_admin(): void {
		Initializer::init();

		$this->assertFalse( has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
		$this->assertFalse( has_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) ) );
	}

	public function test_hooks_up_the_screen_and_its_form_handler_in_wp_admin(): void {
		$this->given_wp_admin();

		Initializer::init();

		$this->assertNotFalse( has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
		$this->assertNotFalse( has_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) ) );
	}

	/**
	 * A second caller must not wire anything up again.
	 */
	public function test_runs_once_per_request(): void {
		Initializer::init();
		$this->given_wp_admin();

		Initializer::init();

		$this->assertFalse( has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
	}
}

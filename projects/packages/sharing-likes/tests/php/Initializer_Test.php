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
	 * Start every case uninitialized.
	 */
	public function set_up() {
		parent::set_up();

		$this->forget_initialization();
	}

	/**
	 * Leave no hooks or initialization behind.
	 */
	public function tear_down() {
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

	public function test_package_version_is_a_version_string(): void {
		$this->assertMatchesRegularExpression( '/^\d+\.\d+\.\d+/', Initializer::PACKAGE_VERSION );
	}

	/**
	 * `is_admin()` is false here, as it is in the REST requests that serve the routes and the admin-menu endpoint.
	 */
	public function test_wires_up_the_routes_screen_and_form_handler_outside_wp_admin(): void {
		Initializer::init();

		$this->assertNotFalse( has_action( 'rest_api_init', array( Endpoints::class, 'register_routes' ) ) );
		$this->assertNotFalse( has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
		$this->assertNotFalse( has_action( 'admin_init', array( Post_Handler::class, 'maybe_handle' ) ) );
	}

	public function test_runs_once_per_request(): void {
		Initializer::init();
		remove_all_actions( 'admin_menu' );

		Initializer::init();

		$this->assertFalse( has_action( 'admin_menu', array( Settings_Page::class, 'register_menu' ) ) );
	}
}

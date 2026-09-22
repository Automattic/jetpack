<?php
/**
 * Tests for the Publicize class.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use WorDBless\BaseTestCase;

/**
 * Tests for Publicize.
 */
class Publicize_Test extends BaseTestCase {

	/**
	 * Deprecations reported while a test ran.
	 *
	 * @var string[]
	 */
	private $deprecated = array();

	/**
	 * Capture deprecations instead of turning them into errors.
	 */
	public function set_up() {
		parent::set_up();

		$this->deprecated = array();
		add_filter( 'deprecated_function_trigger_error', '__return_false' );
		add_action( 'deprecated_function_run', array( $this, 'capture_deprecation' ) );
	}

	/**
	 * Undo set_up().
	 */
	public function tear_down() {
		remove_action( 'deprecated_function_run', array( $this, 'capture_deprecation' ) );
		remove_filter( 'deprecated_function_trigger_error', '__return_false' );
		unset( $_GET['action'] );

		parent::tear_down();
	}

	/**
	 * Record a deprecated function name.
	 *
	 * @param string $function_name The function reported as deprecated.
	 */
	public function capture_deprecation( $function_name ) {
		$this->deprecated[] = $function_name;
	}

	/**
	 * The Sharing settings screen is not hooked at all.
	 */
	public function test_does_not_hook_the_sharing_settings_screen() {
		$publicize = new Publicize();

		$this->assertFalse( has_action( 'load-settings_page_sharing', array( $publicize, 'admin_page_load' ) ) );
	}

	/**
	 * The admin_page_load() shim is deprecated and registers nothing.
	 */
	public function test_admin_page_load_is_deprecated_and_hooks_nothing() {
		$_GET['action'] = 'error';
		$publicize      = new Publicize();

		// @phan-suppress-next-line PhanDeprecatedFunction -- the test is the contract for the deprecated shim.
		$publicize->admin_page_load();

		$this->assertContains( Publicize::class . '::admin_page_load', $this->deprecated );
		$this->assertFalse( has_action( 'pre_admin_screen_sharing', array( $publicize, 'display_connection_error' ) ) );
	}

	/**
	 * The display_connection_error() shim is deprecated and prints nothing.
	 */
	public function test_display_connection_error_is_deprecated_and_prints_nothing() {
		$_GET['action'] = 'error';
		$publicize      = new Publicize();

		ob_start();
		// @phan-suppress-next-line PhanDeprecatedFunction -- the test is the contract for the deprecated shim.
		$publicize->display_connection_error();
		$output = ob_get_clean();

		$this->assertSame( '', $output );
		$this->assertContains( Publicize::class . '::display_connection_error', $this->deprecated );
	}
}

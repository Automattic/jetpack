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
		unset( $_GET['action'], $_GET['service'], $_GET['publicize_error'] );

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

	public function test_collapse_duplicate_post_meta_keeps_one_row() {
		$publicize = new Publicize();
		$post_id   = 123;
		$message   = 'Amaretti ! C:\\temp';
		add_post_meta( $post_id, '_wpas_mess', wp_slash( $message ) );
		add_post_meta( $post_id, '_wpas_mess', wp_slash( $message ) );

		$this->assertSame( 10, has_filter( 'update_post_metadata', array( $publicize, 'collapse_duplicate_post_meta' ) ) );
		$this->assertTrue( $publicize->collapse_duplicate_post_meta( null, $post_id, '_wpas_mess', $message, '' ) );
		$this->assertSame( array( $message ), get_post_meta( $post_id, '_wpas_mess', false ) );
	}

	public function test_collapse_duplicate_post_meta_ignores_other_keys() {
		$publicize = new Publicize();
		$post_id   = 123;
		add_post_meta( $post_id, 'other_key', 'value' );
		add_post_meta( $post_id, 'other_key', 'value' );

		$this->assertNull( $publicize->collapse_duplicate_post_meta( null, $post_id, 'other_key', 'value', '' ) );
		$this->assertCount( 2, get_post_meta( $post_id, 'other_key', false ) );
	}

	public function test_collapse_duplicate_post_meta_ignores_single_row_and_prev_value() {
		$publicize = new Publicize();
		$post_id   = 123;
		add_post_meta( $post_id, '_wpas_mess', 'one' );

		$this->assertNull( $publicize->collapse_duplicate_post_meta( null, $post_id, '_wpas_mess', 'two', '' ) );

		add_post_meta( $post_id, '_wpas_mess', 'one' );
		$this->assertNull( $publicize->collapse_duplicate_post_meta( null, $post_id, '_wpas_mess', 'two', 'one' ) );
		$this->assertCount( 2, get_post_meta( $post_id, '_wpas_mess', false ) );
	}

	public function test_does_not_hook_the_sharing_settings_screen() {
		$publicize = new Publicize();

		$this->assertFalse( has_action( 'load-settings_page_sharing', array( $publicize, 'admin_page_load' ) ) );
	}

	public function test_admin_page_load_is_deprecated_and_hooks_nothing() {
		$_GET['action'] = 'error';
		$publicize      = new Publicize();

		// @phan-suppress-next-line PhanDeprecatedFunction -- the test is the contract for the deprecated shim.
		$publicize->admin_page_load();

		$this->assertContains( Publicize::class . '::admin_page_load', $this->deprecated );
		$this->assertFalse( has_action( 'pre_admin_screen_sharing', array( $publicize, 'display_connection_error' ) ) );
	}

	/**
	 * `service` and `publicize_error` are the arguments the removed body turned into an
	 * error notice; the shim has to stay silent on them.
	 */
	public function test_display_connection_error_is_deprecated_and_prints_nothing() {
		$_GET['service']         = 'facebook';
		$_GET['publicize_error'] = '400';
		$publicize               = new Publicize();

		ob_start();
		// @phan-suppress-next-line PhanDeprecatedFunction -- the test is the contract for the deprecated shim.
		$publicize->display_connection_error();
		$output = ob_get_clean();

		$this->assertSame( '', $output );
		$this->assertContains( Publicize::class . '::display_connection_error', $this->deprecated );
	}

	public function test_get_available_service_data_is_deprecated_and_empty() {
		$publicize = new Publicize();

		// @phan-suppress-next-line PhanDeprecatedFunction -- the test is the contract for the deprecated shim.
		$this->assertSame( array(), $publicize->get_available_service_data() );
		$this->assertContains( Publicize_Base::class . '::get_available_service_data', $this->deprecated );
	}
}

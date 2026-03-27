<?php
/**
 * Tests for the boot import map ordering fix.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Verifies that fix_boot_import_map_ordering moves the import("@wordpress/boot")
 * inline script from a classic script handle to a <script type="module"> printed
 * after the import map.
 *
 * @covers Automattic\Jetpack\Forms\Dashboard\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Boot_Import_Map_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		$GLOBALS['wp_scripts'] = null;
		remove_all_actions( 'admin_print_footer_scripts' );
		remove_all_actions( 'admin_enqueue_scripts' );
		unset( $_GET['page'] );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		$GLOBALS['wp_scripts'] = null;
		remove_all_actions( 'admin_print_footer_scripts' );
		remove_all_actions( 'admin_enqueue_scripts' );
		unset( $_GET['page'] );
		parent::tear_down();
	}

	/**
	 * Simulate what the generated page-wp-admin.php does: register a classic
	 * script with an inline import("@wordpress/boot") call, then verify the
	 * fix moves it to a module script on admin_print_footer_scripts at priority 11.
	 */
	public function test_fix_moves_boot_import_to_module_script() {
		// Simulate being on the Forms admin page.
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;

		$handle = Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '-prerequisites';

		// Simulate the generated page-wp-admin.php: register script + inline import().
		wp_register_script( $handle, '', array(), '1.0', true );
		wp_add_inline_script(
			$handle,
			'import("@wordpress/boot").then(mod => mod.initSinglePage({mountId: "app", routes: []}));'
		);

		// Verify the inline script is attached before the fix.
		$before = wp_scripts()->get_data( $handle, 'after' );
		$this->assertNotEmpty( $before, 'Inline script should be attached before fix runs.' );
		$this->assertTrue(
			$this->array_contains_string( $before, '@wordpress/boot' ),
			'Inline script should contain @wordpress/boot before fix.'
		);

		Dashboard::fix_boot_import_map_ordering();

		// Fire admin_enqueue_scripts to trigger the fix's callback.
		do_action( 'admin_enqueue_scripts', '' );

		// The inline script should have been removed from the classic handle.
		$after = wp_scripts()->get_data( $handle, 'after' );
		$this->assertFalse(
			$this->array_contains_string( is_array( $after ) ? $after : array(), '@wordpress/boot' ),
			'import("@wordpress/boot") should be removed from the classic script handle.'
		);

		// A callback should be registered on admin_print_footer_scripts at priority 11.
		$this->assertGreaterThan(
			0,
			has_action( 'admin_print_footer_scripts' ),
			'A callback should be hooked to admin_print_footer_scripts.'
		);

		// Capture its output and verify it's a <script type="module">.
		ob_start();
		do_action( 'admin_print_footer_scripts' );
		$output = ob_get_clean();

		$this->assertMatchesRegularExpression( '/<script\b[^>]*type=["\']module["\'][^>]*>/', $output );
		$this->assertStringContainsString( '@wordpress/boot', $output );
		$this->assertStringContainsString( 'initSinglePage', $output );
	}

	/**
	 * Verify the fix does not run on non-Forms admin pages.
	 */
	public function test_fix_does_not_run_on_other_pages() {
		$_GET['page'] = 'some-other-page';

		$handle = Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '-prerequisites';

		wp_register_script( $handle, '', array(), '1.0', true );
		wp_add_inline_script(
			$handle,
			'import("@wordpress/boot").then(mod => mod.initSinglePage({mountId: "app", routes: []}));'
		);

		Dashboard::fix_boot_import_map_ordering();
		do_action( 'admin_enqueue_scripts', '' );

		// The inline script should still be on the classic handle.
		$after = wp_scripts()->get_data( $handle, 'after' );
		$this->assertTrue(
			$this->array_contains_string( is_array( $after ) ? $after : array(), '@wordpress/boot' ),
			'import("@wordpress/boot") should remain on the classic script handle on other pages.'
		);

		// Nothing should be hooked to admin_print_footer_scripts.
		ob_start();
		do_action( 'admin_print_footer_scripts' );
		$output = ob_get_clean();

		$this->assertStringNotContainsString( 'type="module"', $output );
	}

	/**
	 * Verify the fix is a no-op when there is no inline script on the handle.
	 */
	public function test_fix_is_noop_without_inline_script() {
		$_GET['page'] = Dashboard::FORMS_WPBUILD_ADMIN_SLUG;

		$handle = Dashboard::FORMS_WPBUILD_ADMIN_SLUG . '-prerequisites';

		wp_register_script( $handle, '', array(), '1.0', true );
		// No wp_add_inline_script — the handle has no 'after' data.

		Dashboard::fix_boot_import_map_ordering();
		do_action( 'admin_enqueue_scripts', '' );

		ob_start();
		do_action( 'admin_print_footer_scripts' );
		$output = ob_get_clean();

		$this->assertStringNotContainsString( 'type="module"', $output );
	}

	/**
	 * Helper: check if any string in the array contains the given substring.
	 *
	 * @param array  $arr    Array of strings.
	 * @param string $needle Substring to search for.
	 * @return bool
	 */
	private function array_contains_string( array $arr, string $needle ): bool {
		foreach ( $arr as $item ) {
			if ( is_string( $item ) && strpos( $item, $needle ) !== false ) {
				return true;
			}
		}
		return false;
	}
}

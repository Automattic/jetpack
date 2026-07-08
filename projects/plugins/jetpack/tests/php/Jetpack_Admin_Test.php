<?php
/**
 * Test Jetpack_Admin class methods for footer removal functionality.
 *
 * @package jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Test Jetpack_Admin class methods for footer removal functionality.
 *
 * @covers \Jetpack_Admin
 */
#[CoversClass( Jetpack_Admin::class )]
class Jetpack_Admin_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The Jetpack_Admin instance.
	 *
	 * @var Jetpack_Admin
	 */
	private $admin;

	/**
	 * Set up the test environment.
	 */
	public function set_up() {
		parent::set_up();

		// Load the Jetpack_Admin class if not already loaded.
		if ( ! class_exists( 'Jetpack_Admin' ) ) {
			require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';
		}

		// Get the singleton instance.
		$this->admin = Jetpack_Admin::init();

		// Set admin context.
		set_current_screen( 'dashboard' );
	}

	/**
	 * Tear down after tests.
	 */
	public function tear_down() {
		// Clear the current screen.
		set_current_screen( 'front' );
		parent::tear_down();
	}

	/**
	 * Helper method to set a mock screen.
	 *
	 * @param string $screen_id The screen ID.
	 * @param string $parent_base The parent base (optional).
	 */
	private function set_mock_screen( $screen_id, $parent_base = '' ) {
		global $current_screen;
		$current_screen              = WP_Screen::get( $screen_id );
		$current_screen->id          = $screen_id;
		$current_screen->parent_base = $parent_base;
	}

	/**
	 * Test add_jetpack_admin_body_class() adds class on Jetpack toplevel page.
	 */
	public function test_add_jetpack_admin_body_class_on_toplevel_page() {
		$this->set_mock_screen( 'toplevel_page_jetpack' );

		$result = $this->admin->add_jetpack_admin_body_class( 'existing-class' );

		$this->assertStringContainsString( 'jetpack-admin-page', $result );
		$this->assertStringContainsString( 'existing-class', $result );
	}

	/**
	 * Test add_jetpack_admin_body_class() adds class on Jetpack Network Admin toplevel page.
	 */
	public function test_add_jetpack_admin_body_class_on_network_toplevel_page() {
		$this->set_mock_screen( 'toplevel_page_jetpack-network' );

		$result = $this->admin->add_jetpack_admin_body_class( 'existing-class' );

		$this->assertStringContainsString( 'jetpack-admin-page', $result );
		$this->assertStringContainsString( 'existing-class', $result );
	}

	/**
	 * Test add_jetpack_admin_body_class() adds class on jetpack_page_* screens.
	 */
	public function test_add_jetpack_admin_body_class_on_jetpack_page() {
		$this->set_mock_screen( 'jetpack_page_settings' );

		$result = $this->admin->add_jetpack_admin_body_class( 'existing-class' );

		$this->assertStringContainsString( 'jetpack-admin-page', $result );
	}

	/**
	 * Test add_jetpack_admin_body_class() adds class on admin_page_jetpack* screens.
	 */
	public function test_add_jetpack_admin_body_class_on_admin_page_jetpack() {
		$this->set_mock_screen( 'admin_page_jetpack_modules' );

		$result = $this->admin->add_jetpack_admin_body_class( 'existing-class' );

		$this->assertStringContainsString( 'jetpack-admin-page', $result );
	}

	/**
	 * Test add_jetpack_admin_body_class() adds class when parent_base is jetpack.
	 */
	public function test_add_jetpack_admin_body_class_with_jetpack_parent_base() {
		$this->set_mock_screen( 'some_submenu_page', 'jetpack' );

		$result = $this->admin->add_jetpack_admin_body_class( 'existing-class' );

		$this->assertStringContainsString( 'jetpack-admin-page', $result );
	}

	/**
	 * Test add_jetpack_admin_body_class() adds class when parent_base is jetpack-network.
	 */
	public function test_add_jetpack_admin_body_class_with_jetpack_network_parent_base() {
		$this->set_mock_screen( 'some_network_submenu_page', 'jetpack-network' );

		$result = $this->admin->add_jetpack_admin_body_class( 'existing-class' );

		$this->assertStringContainsString( 'jetpack-admin-page', $result );
	}

	/**
	 * Test add_jetpack_admin_body_class() doesn't add class on non-Jetpack pages.
	 */
	public function test_add_jetpack_admin_body_class_on_non_jetpack_page() {
		$this->set_mock_screen( 'dashboard' );

		$result = $this->admin->add_jetpack_admin_body_class( 'existing-class' );

		$this->assertStringNotContainsString( 'jetpack-admin-page', $result );
		$this->assertSame( 'existing-class', $result );
	}

	/**
	 * Test add_jetpack_admin_body_class() trims whitespace properly.
	 */
	public function test_add_jetpack_admin_body_class_trims_whitespace() {
		$this->set_mock_screen( 'toplevel_page_jetpack' );

		$result = $this->admin->add_jetpack_admin_body_class( '  existing-class  ' );

		$this->assertStringContainsString( 'jetpack-admin-page', $result );
		$this->assertStringContainsString( 'existing-class', $result );
		// Should not have leading whitespace.
		$this->assertNotSame( ' ', substr( $result, 0, 1 ), 'Result should not start with a space' );
	}

	/**
	 * Test add_jetpack_admin_body_class() handles empty string.
	 */
	public function test_add_jetpack_admin_body_class_handles_empty_string() {
		$this->set_mock_screen( 'toplevel_page_jetpack' );

		$result = $this->admin->add_jetpack_admin_body_class( '' );

		$this->assertStringContainsString( 'jetpack-admin-page', $result );
		$this->assertSame( 'jetpack-admin-page ', $result );
	}

	/**
	 * Test add_footer_removal_styles() outputs styles on Jetpack pages.
	 */
	public function test_add_footer_removal_styles_outputs_on_jetpack_page() {
		$this->set_mock_screen( 'toplevel_page_jetpack' );

		ob_start();
		$this->admin->add_footer_removal_styles();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<style>', $output );
		$this->assertStringContainsString( '.jetpack-admin-page #wpbody-content', $output );
		$this->assertStringContainsString( 'padding-bottom: 0', $output );
		$this->assertStringContainsString( '.jetpack-admin-page #wpfooter', $output );
		$this->assertStringContainsString( 'display: none', $output );
	}

	/**
	 * Test add_footer_removal_styles() outputs nothing on non-Jetpack pages.
	 */
	public function test_add_footer_removal_styles_outputs_nothing_on_non_jetpack_page() {
		$this->set_mock_screen( 'dashboard' );

		ob_start();
		$this->admin->add_footer_removal_styles();
		$output = ob_get_clean();

		$this->assertSame( '', $output );
	}

	/**
	 * Test maybe_remove_admin_footer_text() returns empty on Jetpack pages.
	 */
	public function test_maybe_remove_admin_footer_text_on_jetpack_page() {
		$this->set_mock_screen( 'toplevel_page_jetpack' );

		$result = $this->admin->maybe_remove_admin_footer_text( 'Thank you for creating with WordPress.' );

		$this->assertSame( '', $result );
	}

	/**
	 * Test maybe_remove_admin_footer_text() preserves content on non-Jetpack pages.
	 */
	public function test_maybe_remove_admin_footer_text_on_non_jetpack_page() {
		$this->set_mock_screen( 'dashboard' );

		$original_text = 'Thank you for creating with WordPress.';
		$result        = $this->admin->maybe_remove_admin_footer_text( $original_text );

		$this->assertSame( $original_text, $result );
	}

	/**
	 * Test maybe_remove_admin_footer_version() returns empty on Jetpack pages.
	 */
	public function test_maybe_remove_admin_footer_version_on_jetpack_page() {
		$this->set_mock_screen( 'toplevel_page_jetpack' );

		$result = $this->admin->maybe_remove_admin_footer_version( 'Version 6.4' );

		$this->assertSame( '', $result );
	}

	/**
	 * Test maybe_remove_admin_footer_version() preserves content on non-Jetpack pages.
	 */
	public function test_maybe_remove_admin_footer_version_on_non_jetpack_page() {
		$this->set_mock_screen( 'dashboard' );

		$original_version = 'Version 6.4';
		$result           = $this->admin->maybe_remove_admin_footer_version( $original_version );

		$this->assertSame( $original_version, $result );
	}

	/**
	 * Test detection logic for various jetpack_page_* patterns.
	 */
	public function test_jetpack_page_detection_variations() {
		$jetpack_pages = array(
			'jetpack_page_stats',
			'jetpack_page_akismet',
			'jetpack_page_jetpack-backup',
			'jetpack_page_something-else',
		);

		foreach ( $jetpack_pages as $page_id ) {
			$this->set_mock_screen( $page_id );
			$result = $this->admin->add_jetpack_admin_body_class( 'test' );
			$this->assertStringContainsString( 'jetpack-admin-page', $result, "Failed for page: $page_id" );
		}
	}

	/**
	 * Test detection logic for various admin_page_jetpack* patterns.
	 */
	public function test_admin_page_jetpack_detection_variations() {
		$jetpack_pages = array(
			'admin_page_jetpack',
			'admin_page_jetpack_modules',
			'admin_page_jetpack-something',
		);

		foreach ( $jetpack_pages as $page_id ) {
			$this->set_mock_screen( $page_id );
			$result = $this->admin->add_jetpack_admin_body_class( 'test' );
			$this->assertStringContainsString( 'jetpack-admin-page', $result, "Failed for page: $page_id" );
		}
	}

	/**
	 * Test that non-Jetpack pages are not detected.
	 */
	public function test_non_jetpack_pages_not_detected() {
		$non_jetpack_pages = array(
			'dashboard',
			'plugins',
			'edit-post',
			'woocommerce_page_something',
			'settings_page_general',
		);

		foreach ( $non_jetpack_pages as $page_id ) {
			$this->set_mock_screen( $page_id );
			$result = $this->admin->add_jetpack_admin_body_class( 'test' );
			$this->assertStringNotContainsString( 'jetpack-admin-page', $result, "False positive for page: $page_id" );
		}
	}
}

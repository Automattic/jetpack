<?php
/**
 * Shared Jetpack admin page tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-settings-react-page.php';

/**
 * @covers \Jetpack_Admin_Page
 */
#[CoversClass( Jetpack_Admin_Page::class )]
class Jetpack_Admin_Page_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Log in as an administrator.
	 */
	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
	}

	/**
	 * Tests that the PHP masthead links to the Settings page and no longer offers the old dashboard.
	 */
	public function test_masthead_links_to_the_settings_page_only() {
		ob_start();
		Jetpack_Admin_Page::wrap_ui( '__return_null' );
		$output = ob_get_clean();

		$this->assertStringContainsString( esc_url( admin_url( 'admin.php?page=jetpack-settings#/settings' ) ), $output );
		$this->assertStringNotContainsString( '>' . __( 'Dashboard', 'jetpack' ) . '<', $output );
	}

	/**
	 * Tests that the plan check runs on the Settings page, as it did at page=jetpack.
	 */
	public function test_plan_check_runs_on_the_settings_page() {
		$result = ( new Jetpack_Settings_React_Page() )->check_plan_deactivate_modules( WP_Screen::get( 'jetpack_page_jetpack-settings' ) );

		$this->assertIsArray( $result );
	}
}

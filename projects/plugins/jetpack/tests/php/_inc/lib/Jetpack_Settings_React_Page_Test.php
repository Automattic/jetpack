<?php
/**
 * Settings admin page tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-settings-react-page.php';

/**
 * @covers \Jetpack_Settings_React_Page
 */
#[CoversClass( Jetpack_Settings_React_Page::class )]
class Jetpack_Settings_React_Page_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Log in as an administrator of a connected site.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_menus();

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user_id );

		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "honey.badger.$user_id" ) );

		( new Connection_Manager() )->reset_connection_status();
		Status_Cache::clear();
	}

	/**
	 * Clear the connection, the menus and the request.
	 */
	public function tear_down() {
		foreach ( array( 'master_user', 'id', 'blog_token', 'user_tokens' ) as $option ) {
			Jetpack_Options::delete_option( $option );
		}
		unset( $_GET['page'] );

		( new Connection_Manager() )->reset_connection_status();
		Status_Cache::clear();
		$this->reset_menus();

		parent::tear_down();
	}

	/**
	 * Empty the menu globals and Admin_Menu's queue; WP_UnitTestCase restores neither.
	 */
	private function reset_menus() {
		global $menu, $submenu, $_parent_pages, $_registered_pages;
		$menu              = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu           = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$_parent_pages     = array();
		$_registered_pages = array();
		Admin_Menu::reset();
	}

	/**
	 * Register the page and build the submenu as the admin_menu pass does.
	 *
	 * @return string[] Jetpack submenu slugs.
	 */
	private function register_and_list_slugs() {
		( new Jetpack_Settings_React_Page() )->get_page_hook();
		Admin_Menu::admin_menu_hook_callback();

		return array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 );
	}

	/**
	 * Tests that the page registers under the Jetpack menu with its own hook.
	 */
	public function test_registers_the_settings_page() {
		$this->assertSame( 'jetpack_page_jetpack-settings', ( new Jetpack_Settings_React_Page() )->get_page_hook() );
	}

	/**
	 * Tests that a connected admin sees the Settings entry.
	 */
	public function test_connected_admins_see_the_entry() {
		$this->assertContains( 'jetpack-settings', $this->register_and_list_slugs() );

		Admin_Menu::remove_hidden_menu_items();

		$this->assertContains( 'jetpack-settings', array_column( $GLOBALS['submenu']['jetpack'], 2 ) );
	}

	/**
	 * Tests that an unconnected site keeps the page for the connection screen but hides its entry.
	 */
	public function test_unconnected_site_keeps_the_page_but_hides_the_entry() {
		foreach ( array( 'master_user', 'id', 'blog_token', 'user_tokens' ) as $option ) {
			Jetpack_Options::delete_option( $option );
		}
		( new Connection_Manager() )->reset_connection_status();

		$this->assertContains( 'jetpack-settings', $this->register_and_list_slugs() );

		Admin_Menu::remove_hidden_menu_items();

		$this->assertNotContains( 'jetpack-settings', array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 ) );
	}

	/**
	 * Tests that an editor without a user connection keeps the page for #/connect-user but loses the entry.
	 */
	public function test_unlinked_editors_keep_the_page_but_lose_the_entry() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$this->assertContains( 'jetpack-settings', $this->register_and_list_slugs() );

		Admin_Menu::remove_hidden_menu_items();

		$this->assertNotContains( 'jetpack-settings', array_column( $GLOBALS['submenu']['jetpack'] ?? array(), 2 ) );
	}

	/**
	 * Tests that core notices stay visible, since the IDC banner is one.
	 */
	public function test_keeps_core_notices_visible() {
		$hook = ( new Jetpack_Settings_React_Page() )->get_page_hook();

		$this->assertFalse( has_action( "load-$hook", array( Admin_Menu::class, 'hide_core_admin_notices' ) ) );
	}

	/**
	 * Tests that the app renders without the PHP masthead, as it did at page=jetpack.
	 */
	public function test_renders_the_app_without_the_php_masthead() {
		$_GET['page'] = 'jetpack-settings';

		ob_start();
		( new Jetpack_Settings_React_Page() )->render();
		$output = ob_get_clean();

		$this->assertNotSame( '', trim( $output ) );
		$this->assertStringNotContainsString( '<!-- START OF CALLBACK -->', $output );
	}

	/**
	 * Tests that the page falls back to the modules list when the REST API is off.
	 */
	public function test_falls_back_to_the_modules_list_without_the_rest_api() {
		add_filter( 'rest_authentication_errors', '__return_false' );
		$page = new Jetpack_Settings_React_Page();

		$page->add_fallback_redirects();

		$this->assertNotFalse( has_action( 'admin_head', array( $page, 'add_fallback_head_meta' ) ) );
	}

	/**
	 * Network Admin has its own jetpack-settings page; site pages register from jetpack_admin_menu, which must not fire there.
	 */
	public function test_network_admin_menu_does_not_fire_the_site_menu_hook() {
		$fired = did_action( 'jetpack_admin_menu' );

		do_action( 'network_admin_menu' );

		$this->assertSame( $fired, did_action( 'jetpack_admin_menu' ) );
	}
}

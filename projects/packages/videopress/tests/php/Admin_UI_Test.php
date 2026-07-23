<?php
/**
 * Tests for the Admin_UI modernization gate.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Tests that the modernization filter gates the wpcom Simple menu registration.
 */
class Admin_UI_Test extends BaseTestCase {

	/**
	 * Clean up the filter between tests.
	 */
	public function tearDown(): void {
		parent::tearDown();
		remove_all_filters( Admin_UI::MODERNIZATION_FILTER );
		remove_all_filters( 'jetpack_my_jetpack_should_initialize' );
		remove_action( 'admin_menu', array( Admin_UI::class, 'enable_menu' ), 1 );
		$this->set_admin_menu_items( array() );
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		wp_set_current_user( 0 );
		$this->reset_connection_status_cache();
	}

	/**
	 * Make Connection\Manager::is_connected() return true by storing the
	 * blog ID and blog token it checks for.
	 */
	private function mock_connected_site() {
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		$this->reset_connection_status_cache();
	}

	/**
	 * Make Connection\Manager report a connected site whose current user has
	 * their own user connection (is_user_connected()).
	 */
	private function mock_connected_user() {
		$this->mock_connected_site();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'videopress_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$this->assertIsInt( $user_id );
		wp_set_current_user( $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'user.token.' . $user_id ) );
	}

	/**
	 * Reset the Connection\Manager::$is_connected static cache so each test
	 * re-evaluates the connection options.
	 */
	private function reset_connection_status_cache() {
		$this->accessible_property( Connection_Manager::class, 'is_connected' )->setValue( null, null );
	}

	/**
	 * Read the Admin_Menu package's queued menu items.
	 *
	 * @return array
	 */
	private function get_admin_menu_items() {
		return $this->accessible_property( Admin_Menu::class, 'menu_items' )->getValue();
	}

	/**
	 * Overwrite the Admin_Menu package's queued menu items.
	 *
	 * @param array $items The items to set.
	 */
	private function set_admin_menu_items( $items ) {
		$this->accessible_property( Admin_Menu::class, 'menu_items' )->setValue( null, $items );
	}

	/**
	 * Get an accessible reflection of a non-public property.
	 *
	 * @param string $class_name    The class owning the property.
	 * @param string $property_name The property name.
	 * @return \ReflectionProperty
	 */
	private function accessible_property( $class_name, $property_name ) {
		$property = new \ReflectionProperty( $class_name, $property_name );
		if ( \PHP_VERSION_ID < 80100 ) {
			// Required to access non-public members before PHP 8.1; deprecated no-op since PHP 8.5.
			$property->setAccessible( true );
		}
		return $property;
	}

	/**
	 * Test that is_modernized() defaults to enabled and follows the filter.
	 */
	public function test_is_modernized_follows_the_filter() {
		$this->assertTrue( Admin_UI::is_modernized() );

		add_filter( Admin_UI::MODERNIZATION_FILTER, '__return_false' );
		$this->assertFalse( Admin_UI::is_modernized() );
	}

	/**
	 * Test that the Simple submenu registration bails entirely when
	 * modernization is off (VIDP-285 staged rollout): no menu is registered,
	 * rather than a menu leading to the legacy dashboard, which is
	 * non-functional on Simple.
	 */
	public function test_add_wp_admin_submenu_bails_when_not_modernized() {
		global $submenu;
		$submenu = array();

		add_filter( Admin_UI::MODERNIZATION_FILTER, '__return_false' );
		Admin_UI::add_wp_admin_submenu();

		// The early return must fire before add_submenu_page() — with the flag
		// off, no submenu entry (and no load- hook) may exist.
		$this->assertSame( array(), $submenu );
	}

	/**
	 * Test that init_inactive_menu() hooks the shared dynamic menu registration on admin_menu.
	 */
	public function test_init_inactive_menu_hooks_admin_menu() {
		Admin_UI::init_inactive_menu();

		$this->assertSame( 1, has_action( 'admin_menu', array( Admin_UI::class, 'enable_menu' ) ) );
	}

	/**
	 * Test that enable_menu() resolves the menu target at call time: with the
	 * module inactive it queues the My Jetpack activation link, not the dashboard.
	 */
	public function test_enable_menu_registers_activation_link_when_module_inactive() {
		$this->mock_connected_user();
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_true' );

		$this->assertFalse( Status::is_active() );
		Admin_UI::enable_menu();

		$items = $this->get_admin_menu_items();
		$this->assertCount( 1, $items );
		$this->assertSame( Admin_UI::MY_JETPACK_ADD_VIDEOPRESS_URI, $items[0]['menu_slug'] );
	}

	/**
	 * Test that enable_menu() registers the VideoPress library dashboard
	 * (admin.php?page=jetpack-videopress) when the module is active.
	 *
	 * Runs in a separate process: forcing Status::is_active() true requires
	 * loading the standalone-plugin class stub, which must not leak into the
	 * rest of the suite.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enable_menu_registers_dashboard_when_module_active() {
		require_once __DIR__ . '/mocks/class-jetpack-videopress-plugin.php';

		$this->assertTrue( Status::is_active() );
		Admin_UI::enable_menu();

		$items = $this->get_admin_menu_items();
		$this->assertCount( 1, $items );
		$this->assertSame( Admin_UI::ADMIN_PAGE_SLUG, $items[0]['menu_slug'] );
		$this->assertNotNull( $items[0]['function'] );
	}

	/**
	 * Test that the inactive-state menu item is queued as a plain link to the
	 * My Jetpack "add VideoPress" interstitial.
	 */
	public function test_enable_inactive_menu_queues_my_jetpack_link() {
		$this->mock_connected_user();
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_true' );

		Admin_UI::enable_inactive_menu();

		$items = $this->get_admin_menu_items();
		$this->assertCount( 1, $items );
		$this->assertSame( Admin_UI::MY_JETPACK_ADD_VIDEOPRESS_URI, $items[0]['menu_slug'] );
		$this->assertSame( 'VideoPress', $items[0]['menu_title'] );
		$this->assertSame( 'manage_options', $items[0]['capability'] );
		// No render callback: WordPress renders an unregistered slug as a direct link.
		$this->assertNull( $items[0]['function'] );
	}

	/**
	 * Test that no menu item is queued when My Jetpack is not initialized,
	 * since the link would point to an unregistered page.
	 */
	public function test_enable_inactive_menu_bails_without_my_jetpack() {
		$this->mock_connected_user();
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		Admin_UI::enable_inactive_menu();

		$this->assertSame( array(), $this->get_admin_menu_items() );
	}

	/**
	 * Test that no menu item is queued while Jetpack is not connected at all:
	 * activating VideoPress requires a connection, so the item would be a
	 * dead end.
	 */
	public function test_enable_inactive_menu_bails_when_jetpack_not_connected() {
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_true' );

		Admin_UI::enable_inactive_menu();

		$this->assertSame( array(), $this->get_admin_menu_items() );
	}

	/**
	 * Test that a site-level connection is not enough: the item is only shown
	 * to users with their own user connection. The check runs at admin_menu
	 * time, so the item starts rendering as soon as the current user connects.
	 */
	public function test_enable_inactive_menu_bails_without_user_connection() {
		$this->mock_connected_site();
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_true' );

		Admin_UI::enable_inactive_menu();

		$this->assertSame( array(), $this->get_admin_menu_items() );
	}
}

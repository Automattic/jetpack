<?php
/**
 * Admin_Menu functionality testing.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Connection Manager functionality testing.
 */
class Admin_Menu_Test extends TestCase {

	/**
	 * Administrator user ID created once for the test class.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * Editor user ID created once for the test class.
	 *
	 * @var int
	 */
	private static $editor_user_id;

	/**
	 * Create shared users once for the test class.
	 *
	 * @throws \Exception If test user creation fails.
	 * @return void
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'upgrade_test_admin',
				'user_pass'  => 'pass',
				'user_email' => 'upgrade_admin@example.com',
				'role'       => 'administrator',
			)
		);

		$editor_id = wp_insert_user(
			array(
				'user_login' => 'upgrade_test_editor',
				'user_pass'  => 'pass',
				'user_email' => 'upgrade_editor@example.com',
				'role'       => 'editor',
			)
		);

		if ( is_wp_error( $admin_id ) || is_wp_error( $editor_id ) ) {
			throw new \Exception( 'Failed to create test users' );
		}

		self::$admin_user_id  = $admin_id;
		self::$editor_user_id = $editor_id;
	}

	/**
	 * Clean up test users after all tests complete.
	 *
	 * @return void
	 */
	public static function tearDownAfterClass(): void {
		parent::tearDownAfterClass();

		if ( self::$admin_user_id ) {
			wp_delete_user( self::$admin_user_id );
		}
		if ( self::$editor_user_id ) {
			wp_delete_user( self::$editor_user_id );
		}
	}

	/**
	 * Reset shared state before each test.
	 *
	 * @return void
	 */
	public function setUp(): void {
		parent::setUp();
		global $submenu;
		$submenu = array();
		delete_option( 'jetpack_active_plan' );
		delete_option( 'jetpack_site_products' );
		update_option( 'jetpack_options', array( 'id' => 123456 ) );
		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();
		$connection->method( 'is_connected' )->willReturn( true );
		$connection->method( 'is_user_connected' )->willReturn( true );
		Admin_Menu::set_connection_manager( $connection );
		Admin_Menu::set_visibility_resolver( null );
		remove_all_filters( 'jetpack_admin_menu_visibility' );
		remove_all_filters( 'jetpack_offline_mode' );
		if ( class_exists( '\Automattic\Jetpack\Status\Cache' ) ) {
			\Automattic\Jetpack\Status\Cache::clear();
		}
		wp_dequeue_style( 'jetpack-admin-ui-upgrade-menu' );
		wp_deregister_style( 'jetpack-admin-ui-upgrade-menu' );
		wp_dequeue_script( 'jetpack-admin-ui-upgrade-menu' );
		wp_deregister_script( 'jetpack-admin-ui-upgrade-menu' );
		wp_dequeue_style( Admin_Menu::HIDE_CORE_NOTICES_HANDLE );
		wp_deregister_style( Admin_Menu::HIDE_CORE_NOTICES_HANDLE );

		$this->reset_admin_menu_statics(
			array(
				'menu_items'  => array(),
				'initialized' => false,
			)
		);
	}

	/**
	 * Resets Admin_Menu's static properties, which no test framework restores.
	 *
	 * @param array $properties Property name to the value it should be reset to.
	 */
	private function reset_admin_menu_statics( array $properties ) {
		$reflection = new \ReflectionClass( Admin_Menu::class );

		foreach ( $properties as $name => $value ) {
			if ( ! $reflection->hasProperty( $name ) ) {
				continue;
			}

			$property = $reflection->getProperty( $name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( null, $value );
		}
	}

	/**
	 * Tests whether the page_suffix we return in our method will match the page_suffix returned by the native WP methods
	 *
	 * The idea of this test is to make sure our returned value for the page suffix always matches the value that will be returned
	 * by WP core when the submenu is added.
	 *
	 * @param string $menu_slug The slug of the menu being added.
	 *
	 * @dataProvider page_suffix_matches_data
	 */
	#[DataProvider( 'page_suffix_matches_data' )]
	public function test_page_suffix_matches( $menu_slug ) {

		static $top_registered = false;

		if ( ! $top_registered ) {
			$top_registered = true;
			add_menu_page(
				'Jetpack',
				'Jetpack',
				'edit_posts',
				'jetpack',
				'__return_null',
				'div',
				3
			);

			$user_id = wp_insert_user(
				array(
					'user_login' => 'admin',
					'user_pass'  => 'pass',
					'user_email' => 'admin@admin.com',
					'role'       => 'administrator',
				)
			);

			wp_set_current_user( $user_id );

		}

		$our_suffix = Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', $menu_slug, '__return_null' );
		$wp_suffix  = add_submenu_page( 'jetpack', 'Test', 'Test', 'edit_posts', $menu_slug, '__return_null' );

		$this->assertSame( $our_suffix, $wp_suffix );
	}

	/**
	 * Data provider for test_page_suffix_matches
	 *
	 * @return array
	 */
	public static function page_suffix_matches_data() {
		return array(
			'simple_string' => array( 'testmenu' ),
			'dashes'        => array( 'test-menu' ),
			'underscores'   => array( 'test_menu' ),
			'numbers'       => array( 'test_menu312' ),
			'special_chars' => array( 'test_menu#ç!&' ),
		);
	}

	/**
	 * Adding a menu registers the load hooks that hide core admin notices.
	 *
	 * @return void
	 */
	public function test_add_menu_registers_hide_core_admin_notices_hooks() {
		$hook = Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'notices_menu', '__return_null' );

		$this->assertSame( 'jetpack_page_notices_menu', $hook );
		$this->assertNotFalse(
			has_action( 'load-' . $hook, array( Admin_Menu::class, 'hide_core_admin_notices' ) ),
			'Expected the load hook to hide core admin notices to be registered.'
		);
		$this->assertNotFalse(
			has_action( 'load-' . $hook . '-network', array( Admin_Menu::class, 'hide_core_admin_notices' ) ),
			'Expected the network-admin load hook to hide core admin notices to be registered.'
		);
	}

	/**
	 * The core-notice CSS reaches the page through the style queue, not through a printed style element.
	 *
	 * @return void
	 */
	public function test_hide_core_admin_notices_enqueues_the_css_as_an_inline_style() {
		Admin_Menu::hide_core_admin_notices();

		$this->assertTrue( wp_style_is( Admin_Menu::HIDE_CORE_NOTICES_HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_styles()->registered[ Admin_Menu::HIDE_CORE_NOTICES_HANDLE ]->src );

		$css = implode( '', $this->get_hide_core_notices_css() );

		$this->assertStringContainsString( '#wpbody-content > .notice', $css );
		$this->assertStringContainsString( '#wpbody-content > .update-nag', $css );
		$this->assertStringContainsString( '#wpbody-content > .updated', $css );
		$this->assertStringContainsString( '#wpbody-content > .error', $css );
		$this->assertStringNotContainsString( '<style', $css );
		// JITMs render as `.jetpack-jitm-message`; the selector must not match them.
		$this->assertStringNotContainsString( 'jetpack-jitm-message', $css );
	}

	/**
	 * The CSS loads on a Jetpack page's load hook and stays off every other admin screen.
	 *
	 * @return void
	 */
	public function test_hide_core_admin_notices_css_is_scoped_to_jetpack_pages() {
		$hook = Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'notices_scope_menu', '__return_null' );

		wp_set_current_user( self::$admin_user_id );
		set_current_screen( 'plugins' );

		// Fire a hook that actually runs on every admin screen so this fails if
		// the CSS is ever attached without a page check.
		do_action( 'admin_enqueue_scripts', 'plugins.php' );

		set_current_screen( 'front' );

		$this->assertFalse(
			wp_style_is( Admin_Menu::HIDE_CORE_NOTICES_HANDLE, 'registered' ),
			'Expected no core-notice CSS on a screen that is not a Jetpack page.'
		);

		do_action( 'load-' . $hook ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores

		$this->assertTrue( wp_style_is( Admin_Menu::HIDE_CORE_NOTICES_HANDLE, 'enqueued' ) );
	}

	/**
	 * The CSS is attached once even when the hide callback runs more than once in a request.
	 *
	 * @return void
	 */
	public function test_hide_core_admin_notices_adds_the_css_once() {
		for ( $i = 0; $i < 2; $i++ ) {
			Admin_Menu::hide_core_admin_notices();
		}

		$this->assertCount( 1, $this->get_hide_core_notices_css() );

		ob_start();
		wp_styles()->do_items( array( Admin_Menu::HIDE_CORE_NOTICES_HANDLE ) );
		$output = ob_get_clean();

		$this->assertSame( 1, substr_count( $output, '<style' ) );
		$this->assertSame( 1, substr_count( $output, '#wpbody-content > .notice' ) );
		$this->assertStringContainsString( 'jetpack-admin-ui-hide-core-notices-inline-css', $output );
	}

	/**
	 * The deprecated print shim still enqueues the CSS and reports the deprecation.
	 *
	 * @return void
	 */
	public function test_print_hide_core_admin_notices_style_enqueues_and_is_deprecated() {
		$deprecated = array();
		$capture    = static function ( $function ) use ( &$deprecated ) {
			$deprecated[] = $function;
		};

		add_filter( 'deprecated_function_trigger_error', '__return_false' );
		add_action( 'deprecated_function_run', $capture );

		// @phan-suppress-next-line PhanDeprecatedFunction -- This test is the contract for the deprecated shim.
		Admin_Menu::print_hide_core_admin_notices_style();

		remove_action( 'deprecated_function_run', $capture );
		remove_filter( 'deprecated_function_trigger_error', '__return_false' );

		$this->assertContains( Admin_Menu::class . '::print_hide_core_admin_notices_style', $deprecated );
		$this->assertTrue( wp_style_is( Admin_Menu::HIDE_CORE_NOTICES_HANDLE, 'enqueued' ) );
	}

	/**
	 * Gets the inline CSS attached to the core-notice style handle.
	 *
	 * @return array
	 */
	private function get_hide_core_notices_css() {
		$data = wp_styles()->get_data( Admin_Menu::HIDE_CORE_NOTICES_HANDLE, 'after' );

		return is_array( $data ) ? $data : array();
	}

	/**
	 * Tests that the first registered menu item is returned correctly.
	 *
	 * @return void
	 */
	public function test_first_menu() {
		wp_set_current_user( self::$admin_user_id );

		Admin_Menu::init();
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_1', '__return_null', 3 );
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_2', '__return_null', 1 );
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_3', '__return_null', 4 );
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_4', '__return_null', 5 );
		Admin_Menu::add_menu( 'Test', 'Test', 'edit_posts', 'menu_5', '__return_null', 6 );

		do_action( 'admin_menu' );

		$first = Admin_Menu::get_top_level_menu_item_slug();

		$this->assertSame( 'menu_2', $first );
	}

	/**
	 * A hidden item does not become the destination of the top level Jetpack link.
	 *
	 * Deliberately stops at admin_menu: My Jetpack asks on admin_enqueue_scripts and the
	 * connection package asks outside wp-admin, both before admin_head prunes $submenu.
	 *
	 * @return void
	 */
	public function test_first_menu_skips_a_hidden_item() {
		wp_set_current_user( self::$admin_user_id );

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['first-hidden'] = Admin_Menu::VISIBILITY_HIDDEN;
				return $states;
			}
		);

		Admin_Menu::init();
		Admin_Menu::add_menu( 'Test', 'Test', 'manage_options', 'first-hidden', '__return_null', 1 );
		Admin_Menu::add_menu( 'Test', 'Test', 'manage_options', 'second-shown', '__return_null', 2 );

		do_action( 'admin_menu' );

		$this->assertSame( 'second-shown', Admin_Menu::get_top_level_menu_item_slug() );
	}

	/**
	 * Hiding every declared item still never yields a hidden one.
	 *
	 * The Upgrade entry this package adds itself declares no gate, so something is left to
	 * return here; what matters is that it is not one of the items the host hid.
	 *
	 * @return void
	 */
	public function test_first_menu_never_returns_a_hidden_item() {
		wp_set_current_user( self::$admin_user_id );

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				return array_fill_keys( array_keys( $states ), Admin_Menu::VISIBILITY_HIDDEN );
			}
		);

		Admin_Menu::init();
		Admin_Menu::add_menu( 'Test', 'Test', 'manage_options', 'all-hidden-a', '__return_null', 1 );
		Admin_Menu::add_menu( 'Test', 'Test', 'manage_options', 'all-hidden-b', '__return_null', 2 );

		do_action( 'admin_menu' );

		$this->assertNotContains(
			Admin_Menu::get_top_level_menu_item_slug(),
			array( 'all-hidden-a', 'all-hidden-b' )
		);
	}

	/**
	 * Upgrade item appears in the submenu for an administrator on a free plan.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_shown_for_free_plan_admin() {
		wp_set_current_user( self::$admin_user_id );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemPresent();
	}

	/**
	 * Upgrade item is shown when is_free is explicitly true.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_shown_when_is_free_true() {
		wp_set_current_user( self::$admin_user_id );
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_free',
				'is_free'      => true,
			)
		);

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemPresent();
	}

	/**
	 * Upgrade item is shown for legacy plan format when class is free.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_shown_for_legacy_free_class_plan() {
		wp_set_current_user( self::$admin_user_id );
		update_option( 'jetpack_active_plan', array( 'class' => 'free' ) );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemPresent();
	}

	/**
	 * Upgrade item is absent when the site has a paid plan.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_for_paid_plan() {
		wp_set_current_user( self::$admin_user_id );
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_security',
				'is_free'      => false,
			)
		);

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent for legacy plan format when class is paid.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_for_legacy_paid_class_plan() {
		wp_set_current_user( self::$admin_user_id );
		update_option( 'jetpack_active_plan', array( 'class' => 'security' ) );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent when the plan has is_free field set to false.
	 *
	 * Tests the real-world data structure where plan option includes is_free field.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_when_is_free_false() {
		wp_set_current_user( self::$admin_user_id );
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_complete',
				'is_free'      => false,
			)
		);

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent when product_slug indicates a paid plan.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_for_paid_product_slug() {
		wp_set_current_user( self::$admin_user_id );
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_security_daily',
			)
		);

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent when site has products from attached licenses.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_when_site_has_products() {
		wp_set_current_user( self::$admin_user_id );
		update_option(
			'jetpack_site_products',
			array(
				array(
					'product_slug' => 'jetpack_backup_daily',
				),
			)
		);

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent for users without manage_options capability.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_for_non_admin() {
		wp_set_current_user( self::$editor_user_id );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent when the site is not connected.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_when_site_not_connected() {
		wp_set_current_user( self::$admin_user_id );
		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();
		$connection->expects( $this->atLeastOnce() )
			->method( 'is_connected' )
			->willReturn( false );
		Admin_Menu::set_connection_manager( $connection );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent when the user is not connected (site is connected).
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_when_user_not_connected() {
		wp_set_current_user( self::$admin_user_id );
		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();
		$connection->method( 'is_connected' )->willReturn( true );
		$connection->method( 'is_user_connected' )->willReturn( false );
		Admin_Menu::set_connection_manager( $connection );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade item is absent when the site is in offline (development) mode.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_hidden_when_offline_mode() {
		wp_set_current_user( self::$admin_user_id );
		add_filter( 'jetpack_offline_mode', '__return_true' );

		Admin_Menu::init();
		do_action( 'admin_menu' );

		$this->assertUpgradeMenuItemAbsent();
	}

	/**
	 * Upgrade menu stylesheet is enqueued for a free-plan site.
	 *
	 * The sidebar is visible everywhere in wp-admin, so styles must load globally.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_enqueued_for_free_plan() {
		wp_set_current_user( self::$admin_user_id );

		Admin_Menu::add_upgrade_menu_item_styles();

		$this->assertTrue( wp_style_is( 'jetpack-admin-ui-upgrade-menu', 'enqueued' ) );
	}

	/**
	 * No stylesheet enqueue when the site has a paid plan.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_not_enqueued_for_paid_plan() {
		wp_set_current_user( self::$admin_user_id );
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_complete',
				'is_free'      => false,
			)
		);

		Admin_Menu::add_upgrade_menu_item_styles();

		$this->assertFalse( wp_style_is( 'jetpack-admin-ui-upgrade-menu', 'enqueued' ) );
	}

	/**
	 * No stylesheet enqueue when is_free is false.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_not_enqueued_when_is_free_false() {
		wp_set_current_user( self::$admin_user_id );
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_complete',
				'is_free'      => false,
			)
		);

		Admin_Menu::add_upgrade_menu_item_styles();

		$this->assertFalse( wp_style_is( 'jetpack-admin-ui-upgrade-menu', 'enqueued' ) );
	}

	/**
	 * No stylesheet enqueue when site has products.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_not_enqueued_when_site_has_products() {
		wp_set_current_user( self::$admin_user_id );
		update_option(
			'jetpack_site_products',
			array(
				array(
					'product_slug' => 'jetpack_backup_daily',
				),
			)
		);

		Admin_Menu::add_upgrade_menu_item_styles();

		$this->assertFalse( wp_style_is( 'jetpack-admin-ui-upgrade-menu', 'enqueued' ) );
	}

	/**
	 * No stylesheet enqueue when the site is in offline (development) mode.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_not_enqueued_when_offline_mode() {
		wp_set_current_user( self::$admin_user_id );
		add_filter( 'jetpack_offline_mode', '__return_true' );

		Admin_Menu::add_upgrade_menu_item_styles();

		$this->assertFalse( wp_style_is( 'jetpack-admin-ui-upgrade-menu', 'enqueued' ) );
	}

	/**
	 * No stylesheet enqueue when the site is not connected.
	 *
	 * @return void
	 */
	public function test_upgrade_menu_item_styles_not_enqueued_when_not_connected() {
		wp_set_current_user( self::$admin_user_id );
		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();
		$connection->expects( $this->once() )
			->method( 'is_connected' )
			->willReturn( false );
		Admin_Menu::set_connection_manager( $connection );

		Admin_Menu::add_upgrade_menu_item_styles();

		$this->assertFalse( wp_style_is( 'jetpack-admin-ui-upgrade-menu', 'enqueued' ) );
	}

	/**
	 * Asserts the upgrade submenu item is present under the jetpack top-level menu.
	 *
	 * @return void
	 */
	private function assertUpgradeMenuItemPresent() {
		global $submenu;
		$slugs = array_column( $submenu['jetpack'] ?? array(), 2 );
		$found = array_filter(
			$slugs,
			function ( $slug ) {
				return false !== strpos( $slug, Admin_Menu::UPGRADE_MENU_SLUG );
			}
		);
		$this->assertNotEmpty( $found, 'Expected the upgrade menu item to be registered.' );
	}

	/**
	 * Asserts the upgrade submenu item is absent from the jetpack top-level menu.
	 *
	 * @return void
	 */
	private function assertUpgradeMenuItemAbsent() {
		global $submenu;
		$slugs = array_column( $submenu['jetpack'] ?? array(), 2 );
		$found = array_filter(
			$slugs,
			function ( $slug ) {
				return false !== strpos( $slug, Admin_Menu::UPGRADE_MENU_SLUG );
			}
		);
		$this->assertEmpty( $found, 'Expected the upgrade menu item to be absent.' );
	}

	/**
	 * Items sharing a position fall through to a case-insensitive, number-aware title sort.
	 *
	 * Menu titles mix translated strings with untranslated product names, so a plain strcmp()
	 * would put every lowercase-leading label after the capitalised ones.
	 */
	public function test_equal_positions_sort_by_title_case_insensitively() {
		global $submenu;

		wp_set_current_user( self::$admin_user_id );

		Admin_Menu::add_menu( 'Zebra', 'Zebra', 'manage_options', 'tiebreak-zebra', '__return_null' );
		Admin_Menu::add_menu( 'eCommerce', 'eCommerce', 'manage_options', 'tiebreak-ecommerce', '__return_null' );
		Admin_Menu::add_menu( 'Alpha 10', 'Alpha 10', 'manage_options', 'tiebreak-alpha-10', '__return_null' );
		Admin_Menu::add_menu( 'Alpha 2', 'Alpha 2', 'manage_options', 'tiebreak-alpha-2', '__return_null' );

		do_action( 'admin_menu' );

		$slugs = array_column( $submenu['jetpack'], 2 );
		$order = array_values(
			array_filter(
				$slugs,
				function ( $slug ) {
					return str_starts_with( $slug, 'tiebreak-' );
				}
			)
		);

		$this->assertSame(
			array( 'tiebreak-alpha-2', 'tiebreak-alpha-10', 'tiebreak-ecommerce', 'tiebreak-zebra' ),
			$order,
			'Equal-position items should sort case-insensitively, with numbers in natural order.'
		);
	}

	/**
	 * An item that declares no gate is registered, whatever a resolver would say.
	 */
	public function test_item_without_a_gate_is_always_registered() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::set_visibility_resolver( '__return_false' );

		Admin_Menu::add_menu( 'Ungated', 'Ungated', 'manage_options', 'gate-none', '__return_null' );

		$this->render_menu();

		$this->assertContains( 'gate-none', $this->get_submenu_slugs() );
	}

	/**
	 * A declared gate the resolver reports as satisfied keeps the item.
	 */
	public function test_satisfied_gate_registers_the_item() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::set_visibility_resolver( '__return_true' );

		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'gate-on', '__return_null', null, array( 'product' => 'stats' ) );

		$this->render_menu();

		$this->assertContains( 'gate-on', $this->get_submenu_slugs() );
	}

	/**
	 * A declared gate the resolver reports as unsatisfied removes the item.
	 */
	public function test_unsatisfied_gate_removes_the_item() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::set_visibility_resolver( '__return_false' );

		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'gate-off', '__return_null', null, array( 'product' => 'stats' ) );

		$this->render_menu();

		$this->assertNotContains( 'gate-off', $this->get_submenu_slugs() );
	}

	/**
	 * The resolver sees the declaration it was given.
	 */
	public function test_resolver_receives_the_declared_args() {
		wp_set_current_user( self::$admin_user_id );
		$seen = array();
		Admin_Menu::set_visibility_resolver(
			function ( $args ) use ( &$seen ) {
				$seen[] = $args;
				return true;
			}
		);

		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'gate-args', '__return_null', null, array( 'module' => 'seo-tools' ) );

		$this->render_menu();

		$this->assertSame( array( array( 'module' => 'seo-tools' ) ), $seen );
	}

	/**
	 * With no resolver registered, a gated item still appears.
	 *
	 * My Jetpack registers the resolver and does not initialize in offline mode, so this is
	 * the live path on any site where it bows out — it must not strip the sidebar.
	 */
	public function test_gate_without_a_resolver_fails_open() {
		wp_set_current_user( self::$admin_user_id );

		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'gate-no-resolver', '__return_null', null, array( 'product' => 'stats' ) );

		$this->render_menu();

		$this->assertContains( 'gate-no-resolver', $this->get_submenu_slugs() );
	}

	/**
	 * A resolver that cannot answer leaves the item alone.
	 */
	public function test_unresolvable_gate_fails_open() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::set_visibility_resolver( '__return_null' );

		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'gate-unknown', '__return_null', null, array( 'product' => 'not-a-product' ) );

		$this->render_menu();

		$this->assertContains( 'gate-unknown', $this->get_submenu_slugs() );
	}

	/**
	 * A host can hide an item that nothing else would have removed.
	 */
	public function test_host_can_hide_an_ungated_item() {
		wp_set_current_user( self::$admin_user_id );

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['host-hidden'] = Admin_Menu::VISIBILITY_HIDDEN;
				return $states;
			}
		);

		Admin_Menu::add_menu( 'Hidden', 'Hidden', 'manage_options', 'host-hidden', '__return_null' );
		Admin_Menu::add_menu( 'Kept', 'Kept', 'manage_options', 'host-kept', '__return_null' );

		$this->render_menu();

		$slugs = $this->get_submenu_slugs();
		$this->assertNotContains( 'host-hidden', $slugs );
		$this->assertContains( 'host-kept', $slugs );
	}

	/**
	 * A host can force in an item whose gate is unsatisfied.
	 */
	public function test_host_can_force_an_inactive_item_visible() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::set_visibility_resolver( '__return_false' );

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['host-forced'] = Admin_Menu::VISIBILITY_VISIBLE;
				return $states;
			}
		);

		Admin_Menu::add_menu( 'Forced', 'Forced', 'manage_options', 'host-forced', '__return_null', null, array( 'product' => 'stats' ) );

		$this->render_menu();

		$this->assertContains( 'host-forced', $this->get_submenu_slugs() );
	}

	/**
	 * Hiding every item takes the empty Jetpack top level menu with it.
	 *
	 * Only reachable when the Jetpack plugin is absent; with it present the top level menu is
	 * its own and stays regardless.
	 */
	public function test_hiding_every_item_removes_the_top_level_menu() {
		global $menu;

		if ( class_exists( 'Jetpack_React_Page' ) ) {
			$this->markTestSkipped( 'Top level menu belongs to the Jetpack plugin when it is present.' );
		}

		wp_set_current_user( self::$admin_user_id );
		$menu = array();

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				return array_fill_keys( array_keys( $states ), Admin_Menu::VISIBILITY_HIDDEN );
			}
		);

		Admin_Menu::add_menu( 'A', 'A', 'manage_options', 'lonely-a', '__return_null' );

		$this->render_menu();

		$this->assertNotContains( 'jetpack', array_column( $menu, 2 ) );
	}

	/**
	 * Forcing an item visible does not hand it to a user who lacks the capability.
	 */
	public function test_forced_visible_still_respects_capability() {
		global $submenu;

		Admin_Menu::set_visibility_resolver( '__return_false' );
		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['host-forced-caps'] = Admin_Menu::VISIBILITY_VISIBLE;
				return $states;
			}
		);

		Admin_Menu::add_menu( 'Forced', 'Forced', 'manage_options', 'host-forced-caps', '__return_null', null, array( 'product' => 'stats' ) );

		wp_set_current_user( self::$admin_user_id );
		$this->render_menu();
		$this->assertContains( 'host-forced-caps', $this->get_submenu_slugs(), 'An admin should see the forced item, or the editor case below proves nothing.' );

		$submenu = array();
		wp_set_current_user( self::$editor_user_id );
		$this->render_menu();
		$this->assertNotContains( 'host-forced-caps', $this->get_submenu_slugs() );
	}

	/**
	 * The filter passes the whole map, so two hosts setting different keys both take effect.
	 */
	public function test_two_filters_merge_rather_than_clobber() {
		wp_set_current_user( self::$admin_user_id );

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['merge-a'] = Admin_Menu::VISIBILITY_HIDDEN;
				return $states;
			}
		);
		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['merge-b'] = Admin_Menu::VISIBILITY_HIDDEN;
				return $states;
			}
		);

		Admin_Menu::add_menu( 'A', 'A', 'manage_options', 'merge-a', '__return_null' );
		Admin_Menu::add_menu( 'B', 'B', 'manage_options', 'merge-b', '__return_null' );
		Admin_Menu::add_menu( 'C', 'C', 'manage_options', 'merge-c', '__return_null' );

		$this->render_menu();

		$slugs = $this->get_submenu_slugs();
		$this->assertNotContains( 'merge-a', $slugs );
		$this->assertNotContains( 'merge-b', $slugs );
		$this->assertContains( 'merge-c', $slugs );
	}

	/**
	 * Every registered item is offered to the filter, defaulted to 'default'.
	 */
	public function test_filter_receives_every_item_defaulted() {
		wp_set_current_user( self::$admin_user_id );
		$states = null;

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $passed ) use ( &$states ) {
				$states = $passed;
				return $passed;
			}
		);

		Admin_Menu::add_menu( 'A', 'A', 'manage_options', 'offered-a', '__return_null' );
		Admin_Menu::add_menu( 'B', 'B', 'manage_options', 'offered-b', '__return_null' );

		$this->render_menu();

		$this->assertSame(
			array(
				'offered-a' => Admin_Menu::VISIBILITY_DEFAULT,
				'offered-b' => Admin_Menu::VISIBILITY_DEFAULT,
			),
			$states
		);
	}

	/**
	 * A filter that returns something other than a map leaves every item alone.
	 *
	 * The is_array() guard is what keeps one host's broken filter from emptying the sidebar,
	 * so it is worth pinning against a refactor that drops it.
	 *
	 * @param mixed $returned What the misbehaving filter hands back.
	 *
	 * @dataProvider non_array_filter_returns
	 */
	#[DataProvider( 'non_array_filter_returns' )]
	public function test_non_array_filter_return_leaves_items_alone( $returned ) {
		wp_set_current_user( self::$admin_user_id );

		add_filter(
			'jetpack_admin_menu_visibility',
			function () use ( $returned ) {
				return $returned;
			}
		);

		Admin_Menu::add_menu( 'Ungated', 'Ungated', 'manage_options', 'broken-filter-ungated', '__return_null' );
		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'broken-filter-gated', '__return_null', null, array( 'product' => 'stats' ) );
		Admin_Menu::set_visibility_resolver( '__return_true' );

		$this->render_menu();

		$slugs = $this->get_submenu_slugs();
		$this->assertContains( 'broken-filter-ungated', $slugs );
		$this->assertContains( 'broken-filter-gated', $slugs );
	}

	/**
	 * Return values a host filter might hand back instead of the state map.
	 *
	 * @return array
	 */
	public static function non_array_filter_returns() {
		return array(
			'null'   => array( null ),
			'false'  => array( false ),
			'string' => array( 'hidden' ),
		);
	}

	/**
	 * An item that declares a key is named by that key, not by its menu slug.
	 *
	 * Items registered with a URL as their slug need this; a host should not have to paste a
	 * redirect URL into a filter to hide one.
	 */
	public function test_declared_key_identifies_the_item() {
		wp_set_current_user( self::$admin_user_id );

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['jetpack-manage'] = Admin_Menu::VISIBILITY_HIDDEN;
				return $states;
			}
		);

		Admin_Menu::add_menu( 'Manage', 'Manage', 'manage_options', 'https://example.org/manage', '__return_null', null, array( 'key' => 'jetpack-manage' ) );

		$this->render_menu();

		$this->assertNotContains( 'https://example.org/manage', $this->get_submenu_slugs() );
	}

	/**
	 * One key covers an item that registers under a different slug depending on state.
	 *
	 * VideoPress is the live case: the dashboard slug when the module is active, a My Jetpack
	 * URL when it isn't. A host hiding VideoPress should not have to name both, or know which
	 * one the site is currently on.
	 *
	 * @param string $slug The slug this registration happens to use.
	 *
	 * @dataProvider one_key_two_slugs_data
	 */
	#[DataProvider( 'one_key_two_slugs_data' )]
	public function test_one_key_covers_either_registration( $slug ) {
		wp_set_current_user( self::$admin_user_id );

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['jetpack-videopress'] = Admin_Menu::VISIBILITY_HIDDEN;
				return $states;
			}
		);

		Admin_Menu::add_menu( 'VideoPress', 'VideoPress', 'manage_options', $slug, '__return_null', null, array( 'key' => 'jetpack-videopress' ) );

		$this->render_menu();

		$this->assertNotContains( $slug, $this->get_submenu_slugs() );
	}

	/**
	 * The two slugs one VideoPress item registers under.
	 *
	 * @return array
	 */
	public static function one_key_two_slugs_data() {
		return array(
			'module active'   => array( 'jetpack-videopress' ),
			'module inactive' => array( 'admin.php?page=my-jetpack#/add-videopress' ),
		);
	}

	/**
	 * Hiding an item removes its sidebar entry but leaves its page reachable.
	 *
	 * Core's access check runs between admin_menu and admin_head and reads $submenu, so the
	 * entry has to survive until admin_head for a link into the page to load.
	 *
	 * @param string $how Whether a host hid the item or its gate is unsatisfied.
	 *
	 * @dataProvider hidden_item_data
	 */
	#[DataProvider( 'hidden_item_data' )]
	public function test_hidden_item_keeps_its_page_reachable( $how ) {
		global $_registered_pages, $pagenow, $plugin_page;

		wp_set_current_user( self::$admin_user_id );
		$_registered_pages = array();

		if ( 'host' === $how ) {
			add_filter(
				'jetpack_admin_menu_visibility',
				function ( $states ) {
					$states['page-hidden'] = Admin_Menu::VISIBILITY_HIDDEN;
					return $states;
				}
			);
			$args = array();
		} else {
			Admin_Menu::set_visibility_resolver( '__return_false' );
			$args = array( 'product' => 'stats' );
		}

		Admin_Menu::add_menu( 'Hidden', 'Hidden', 'manage_options', 'page-hidden', '__return_null', null, $args );
		Admin_Menu::add_menu( 'Shown', 'Shown', 'manage_options', 'page-shown', '__return_null' );

		do_action( 'admin_menu' );

		$pagenow     = 'admin.php'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$plugin_page = 'page-hidden'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$this->assertArrayHasKey( 'jetpack_page_page-hidden', $_registered_pages );
		$this->assertTrue( user_can_access_admin_page() );

		ob_start();
		do_action( 'admin_head' );
		ob_end_clean();

		$slugs = $this->get_submenu_slugs();
		$this->assertNotContains( 'page-hidden', $slugs );
		$this->assertContains( 'page-shown', $slugs );

		$pagenow     = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$plugin_page = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	/**
	 * The two ways an item ends up hidden.
	 *
	 * @return array
	 */
	public static function hidden_item_data() {
		return array(
			'hidden by a host' => array( 'host' ),
			'gate unsatisfied' => array( 'gate' ),
		);
	}

	/**
	 * Fires the two hooks between which the sidebar is built and then trimmed for rendering.
	 *
	 * @return void
	 */
	private function render_menu() {
		do_action( 'admin_menu' );
		ob_start(); // Core prints head markup on admin_head.
		do_action( 'admin_head' );
		ob_end_clean();
	}

	/**
	 * Returns the slugs currently registered under the Jetpack top-level menu.
	 *
	 * @return array
	 */
	private function get_submenu_slugs() {
		global $submenu;

		return array_column( $submenu['jetpack'] ?? array(), 2 );
	}

	/**
	 * Suffix production appends to menu titles that leave wp-admin.
	 */
	private const EXTERNAL_MARK = ' <span aria-hidden="true">↗</span>';

	/**
	 * Clears every piece of state a previous render left behind.
	 *
	 * Core's add_submenu_page() writes to four globals and WorDBless restores none of them, so a
	 * second render in the same test would otherwise re-sort the first render's items with its own.
	 */
	private function reset_menu_state() {
		global $menu, $submenu, $_parent_pages, $_registered_pages;
		$menu              = array();
		$submenu           = array();
		$_parent_pages     = array();
		$_registered_pages = array();

		$this->reset_admin_menu_statics(
			array(
				'menu_items'  => array(),
				'page_hooks'  => array(),
				'initialized' => false,
			)
		);
	}

	/**
	 * Registers a set of menu items the way a request would, and reports the order they came out in.
	 *
	 * @param array $items    Triples of [ menu title, menu slug, position ]; omit the position to land in the alphabetical tier.
	 * @param int   $priority Priority to register on, to prove the sort does not care.
	 * @return array Menu titles, in the order WordPress ended up rendering them.
	 */
	private function render_items( array $items, $priority = 10 ) {
		$this->reset_menu_state();
		wp_set_current_user( self::$admin_user_id );

		$register = static function () use ( $items ) {
			foreach ( $items as $item ) {
				Admin_Menu::add_menu( $item[0], $item[0], 'manage_options', $item[1], '__return_null', $item[2] ?? null );
			}
		};

		// Each closure is a distinct callback, so leaving it hooked would make the next render
		// re-register this one's items on top of its own.
		add_action( 'admin_menu', $register, $priority );
		do_action( 'admin_menu' );
		remove_action( 'admin_menu', $register, $priority );

		global $submenu;
		$titles = empty( $submenu['jetpack'] ) ? array() : array_column( $submenu['jetpack'], 0 );

		// The free-plan upsell is appended after the sort, so it is not part of the ordering contract.
		return array_values(
			array_filter(
				$titles,
				static function ( $title ) {
					return 'Upgrade Jetpack' !== $title;
				}
			)
		);
	}

	/**
	 * The products a Jetpack site can put in the sidebar, with the titles and tiers they register with.
	 *
	 * @return array Product key to [ menu title, menu slug, position ] triple.
	 */
	private static function product_fixtures() {
		return array(
			'my-jetpack'   => array( 'My Jetpack', 'my-jetpack', -10 ),
			'activity-log' => array( 'Activity Log', 'jetpack-activity-log' ),
			'ai'           => array( 'Jetpack AI', 'jetpack-ai' ),
			'akismet'      => array( 'Akismet Anti-spam', 'akismet-key-config' ),
			'backup'       => array( 'Backup', 'jetpack-backup' ),
			'blaze'        => array( 'Blaze Ads', 'advertising' ),
			'boost'        => array( 'Boost', 'jetpack-boost' ),
			'forms'        => array( 'Forms', 'jetpack-forms' ),
			'newsletter'   => array( 'Newsletter', 'jetpack-newsletter' ),
			'podcast'      => array( 'Podcast', 'jetpack-podcast' ),
			'protect'      => array( 'Protect', 'jetpack-protect' ),
			'scan'         => array( 'Scan', 'jetpack-scan' ),
			'search'       => array( 'Search', 'jetpack-search' ),
			'seo'          => array( 'SEO', 'jetpack-seo' ),
			'social'       => array( 'Social', 'jetpack-social' ),
			'videopress'   => array( 'VideoPress', 'jetpack-videopress' ),
			'manage'       => array( 'Jetpack Manage' . self::EXTERNAL_MARK, 'https://example.org/manage', 100 ),
			'subscribers'  => array( 'Subscribers' . self::EXTERNAL_MARK, 'https://example.org/subscribers', 100 ),
			'beta'         => array( 'Beta Tester', 'jetpack-beta', 998 ),
			'settings'     => array( 'Settings', 'jetpack#/settings', 998 ),
		);
	}

	/**
	 * Builds a registration list from product keys.
	 *
	 * @param array $keys Keys into product_fixtures().
	 * @return array Registration triples.
	 */
	private static function products( array $keys ) {
		$fixtures = self::product_fixtures();

		return array_values(
			array_map(
				static function ( $key ) use ( $fixtures ) {
					return $fixtures[ $key ];
				},
				$keys
			)
		);
	}

	/**
	 * Product combinations a site can be in, and the order the sidebar should come out in.
	 *
	 * @return array
	 */
	public static function product_combinations_data() {
		return array(
			'only my jetpack'                    => array(
				array( 'my-jetpack' ),
				array( 'My Jetpack' ),
			),
			'scattered middle'                   => array(
				array( 'my-jetpack', 'videopress', 'backup', 'forms', 'subscribers', 'settings' ),
				array( 'My Jetpack', 'Backup', 'Forms', 'VideoPress', 'Subscribers' . self::EXTERNAL_MARK, 'Settings' ),
			),
			'everything active'                  => array(
				array(
					'my-jetpack',
					'activity-log',
					'ai',
					'akismet',
					'backup',
					'blaze',
					'boost',
					'forms',
					'newsletter',
					'podcast',
					'protect',
					'scan',
					'search',
					'seo',
					'social',
					'videopress',
					'manage',
					'subscribers',
					'beta',
					'settings',
				),
				array(
					'My Jetpack',
					'Activity Log',
					'Akismet Anti-spam',
					'Backup',
					'Blaze Ads',
					'Boost',
					'Forms',
					'Jetpack AI',
					'Newsletter',
					'Podcast',
					'Protect',
					'Scan',
					'Search',
					'SEO',
					'Social',
					'VideoPress',
					'Jetpack Manage' . self::EXTERNAL_MARK,
					'Subscribers' . self::EXTERNAL_MARK,
					'Beta Tester',
					'Settings',
				),
			),
			'no products, only the pinned tiers' => array(
				array( 'my-jetpack', 'settings' ),
				array( 'My Jetpack', 'Settings' ),
			),
		);
	}

	/**
	 * The sidebar order holds across the product combinations a site can be in.
	 *
	 * @param array $keys     Product keys to register.
	 * @param array $expected Menu titles in the order they should render.
	 *
	 * @dataProvider product_combinations_data
	 */
	#[DataProvider( 'product_combinations_data' )]
	public function test_menu_order_across_product_combinations( array $keys, array $expected ) {
		$order = $this->render_items( self::products( $keys ) );

		$this->assertSame( $expected, $order );
		$this->assertSame( 'My Jetpack', $order[0], 'My Jetpack should be pinned first in every combination.' );
	}

	/**
	 * Activating a product drops it into its alphabetical slot rather than onto the end.
	 */
	public function test_activating_a_product_inserts_it_alphabetically() {
		$without = self::products( array( 'my-jetpack', 'backup', 'newsletter', 'videopress' ) );
		$with    = self::products( array( 'my-jetpack', 'backup', 'newsletter', 'videopress', 'forms' ) );

		$this->assertSame( array( 'My Jetpack', 'Backup', 'Newsletter', 'VideoPress' ), $this->render_items( $without ) );
		$this->assertSame( array( 'My Jetpack', 'Backup', 'Forms', 'Newsletter', 'VideoPress' ), $this->render_items( $with ) );
	}

	/**
	 * Deactivating a product leaves the rest of the sidebar in order.
	 */
	public function test_deactivating_a_product_leaves_the_rest_in_order() {
		$with    = self::products( array( 'my-jetpack', 'backup', 'forms', 'newsletter', 'videopress' ) );
		$without = self::products( array( 'my-jetpack', 'backup', 'newsletter', 'videopress' ) );

		$this->assertSame( array( 'My Jetpack', 'Backup', 'Forms', 'Newsletter', 'VideoPress' ), $this->render_items( $with ) );
		$this->assertSame( array( 'My Jetpack', 'Backup', 'Newsletter', 'VideoPress' ), $this->render_items( $without ) );
	}

	/**
	 * The same active set gives the same order whichever plugin registered first.
	 */
	public function test_menu_order_is_independent_of_registration_order() {
		$keys     = array( 'my-jetpack', 'videopress', 'backup', 'forms', 'seo', 'subscribers', 'settings' );
		$products = self::products( $keys );
		$expected = $this->render_items( $products );

		$this->assertSame( array( 'My Jetpack', 'Backup', 'Forms', 'SEO', 'VideoPress', 'Subscribers' . self::EXTERNAL_MARK, 'Settings' ), $expected );
		$this->assertSame( $expected, $this->render_items( array_reverse( $products ) ) );
		$this->assertSame( $expected, $this->render_items( self::products( array( 'settings', 'forms', 'my-jetpack', 'subscribers', 'seo', 'videopress', 'backup' ) ) ) );
	}

	/**
	 * Nor does it depend on which hook or priority an item registered on.
	 *
	 * This is the mechanism the sort relies on: add_menu() only collects, and the single usort runs
	 * at admin_menu priority 1000, after every registration below it has been gathered.
	 */
	public function test_menu_order_is_independent_of_hook_and_priority() {
		$products = self::products( array( 'my-jetpack', 'videopress', 'backup', 'forms' ) );
		$expected = array( 'My Jetpack', 'Backup', 'Forms', 'VideoPress' );

		foreach ( array( 1, 9, 500 ) as $priority ) {
			$this->assertSame( $expected, $this->render_items( $products, $priority ), "Registering at admin_menu priority {$priority} should not change the order." );
		}
	}

	/**
	 * An explicit position opts an item out of alphabetical order, which is how it was overwritten before.
	 *
	 * Asserted loosely on purpose: core splices a small int a second time inside
	 * add_submenu_page(), so where it lands matches neither the alphabet nor the number asked for.
	 */
	public function test_an_explicit_position_removes_an_item_from_the_alphabetical_run() {
		$alphabetical = array( 'My Jetpack', 'Backup', 'Forms', 'VideoPress' );
		$products     = self::products( array( 'my-jetpack', 'backup', 'forms', 'videopress' ) );

		$this->assertSame( $alphabetical, $this->render_items( $products ) );

		$products[3] = array( 'VideoPress', 'jetpack-videopress', 3 );

		$this->assertNotSame( $alphabetical, $this->render_items( $products ), 'An explicit position should take VideoPress out of the alphabetical run.' );
	}

	/**
	 * A translation that reorders the labels reorders the sidebar.
	 *
	 * The slugs are left in the opposite order to the translations, so a sort that read them
	 * instead of the menu title would fail here.
	 */
	public function test_titles_sort_on_the_translated_label() {
		$translations = array(
			'Alpha'   => 'Zuletzt',
			'Bravo'   => 'Mittig',
			'Charlie' => 'Anfang',
		);

		$filter = static function ( $translated, $text ) use ( $translations ) {
			return $translations[ $text ] ?? $translated;
		};

		add_filter( 'gettext', $filter, 10, 2 );

		$order = $this->render_items(
			array(
				array( __( 'Alpha', 'jetpack-admin-ui' ), 'locale-alpha' ),
				array( __( 'Bravo', 'jetpack-admin-ui' ), 'locale-bravo' ),
				array( __( 'Charlie', 'jetpack-admin-ui' ), 'locale-charlie' ),
			)
		);

		remove_filter( 'gettext', $filter, 10 );

		$this->assertSame( array( 'Anfang', 'Mittig', 'Zuletzt' ), $order );
	}

	/**
	 * Accented labels sort after Z, which is the collation tradeoff we accepted.
	 *
	 * The comparator compares bytes, so every multi-byte leading character lands past the ASCII
	 * range. A Collator would file Éclair with the Es. Verified identical on PHP 7.4 and 8.5.
	 */
	public function test_accented_titles_sort_after_z() {
		$order = $this->render_items(
			array(
				array( 'Übersicht', 'collation-u' ),
				array( 'Éclair', 'collation-e' ),
				array( 'Zebra', 'collation-z' ),
				array( 'Apfel', 'collation-a' ),
			)
		);

		$this->assertSame( array( 'Apfel', 'Zebra', 'Éclair', 'Übersicht' ), $order );
	}
}

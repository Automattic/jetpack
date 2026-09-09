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

		$reflection = new \ReflectionClass( Admin_Menu::class );

		if ( $reflection->hasProperty( 'menu_items' ) ) {
			$menu_items = $reflection->getProperty( 'menu_items' );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$menu_items->setAccessible( true );
			}
			$menu_items->setValue( null, array() );
		}

		if ( $reflection->hasProperty( 'initialized' ) ) {
			$initialized = $reflection->getProperty( 'initialized' );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$initialized->setAccessible( true );
			}
			$initialized->setValue( null, false );
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

		do_action( 'admin_menu' );

		$this->assertContains( 'gate-none', $this->get_submenu_slugs() );
	}

	/**
	 * A declared gate the resolver reports as satisfied keeps the item.
	 */
	public function test_satisfied_gate_registers_the_item() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::set_visibility_resolver( '__return_true' );

		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'gate-on', '__return_null', null, array( 'product' => 'stats' ) );

		do_action( 'admin_menu' );

		$this->assertContains( 'gate-on', $this->get_submenu_slugs() );
	}

	/**
	 * A declared gate the resolver reports as unsatisfied removes the item.
	 */
	public function test_unsatisfied_gate_removes_the_item() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::set_visibility_resolver( '__return_false' );

		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'gate-off', '__return_null', null, array( 'product' => 'stats' ) );

		do_action( 'admin_menu' );

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

		do_action( 'admin_menu' );

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

		do_action( 'admin_menu' );

		$this->assertContains( 'gate-no-resolver', $this->get_submenu_slugs() );
	}

	/**
	 * A resolver that cannot answer leaves the item alone.
	 */
	public function test_unresolvable_gate_fails_open() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::set_visibility_resolver( '__return_null' );

		Admin_Menu::add_menu( 'Gated', 'Gated', 'manage_options', 'gate-unknown', '__return_null', null, array( 'product' => 'not-a-product' ) );

		do_action( 'admin_menu' );

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

		do_action( 'admin_menu' );

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

		do_action( 'admin_menu' );

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

		do_action( 'admin_menu' );

		$this->assertNotContains( 'jetpack', array_column( $menu, 2 ) );
	}

	/**
	 * Forcing an item visible does not hand it to a user who lacks the capability.
	 */
	public function test_forced_visible_still_respects_capability() {
		wp_set_current_user( self::$editor_user_id );

		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['host-forced-caps'] = Admin_Menu::VISIBILITY_VISIBLE;
				return $states;
			}
		);

		Admin_Menu::add_menu( 'Forced', 'Forced', 'manage_options', 'host-forced-caps', '__return_null' );

		do_action( 'admin_menu' );

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

		do_action( 'admin_menu' );

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

		do_action( 'admin_menu' );

		$this->assertSame(
			array(
				'offered-a' => Admin_Menu::VISIBILITY_DEFAULT,
				'offered-b' => Admin_Menu::VISIBILITY_DEFAULT,
			),
			$states
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

		do_action( 'admin_menu' );

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

		do_action( 'admin_menu' );

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
	 * Returns the slugs currently registered under the Jetpack top-level menu.
	 *
	 * @return array
	 */
	private function get_submenu_slugs() {
		global $submenu;

		return array_column( $submenu['jetpack'] ?? array(), 2 );
	}
}

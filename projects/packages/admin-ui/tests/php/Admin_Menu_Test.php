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
		remove_all_filters( 'jetpack_offline_mode' );
		if ( class_exists( '\Automattic\Jetpack\Status\Cache' ) ) {
			\Automattic\Jetpack\Status\Cache::clear();
		}
		wp_dequeue_style( 'jetpack-admin-ui-upgrade-menu' );
		wp_deregister_style( 'jetpack-admin-ui-upgrade-menu' );
		wp_dequeue_script( 'jetpack-admin-ui-upgrade-menu' );
		wp_deregister_script( 'jetpack-admin-ui-upgrade-menu' );

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
	 * Calling hide_core_admin_notices queues the inline style printer.
	 *
	 * @return void
	 */
	public function test_hide_core_admin_notices_queues_inline_style() {
		Admin_Menu::hide_core_admin_notices();

		$this->assertNotFalse(
			has_action( 'admin_print_styles', array( Admin_Menu::class, 'print_hide_core_admin_notices_style' ) ),
			'Expected the inline style printer to be hooked to admin_print_styles.'
		);

		remove_action( 'admin_print_styles', array( Admin_Menu::class, 'print_hide_core_admin_notices_style' ) );
	}

	/**
	 * The printed style targets only direct-child core notices, leaving JITMs untouched.
	 *
	 * @return void
	 */
	public function test_print_hide_core_admin_notices_style_output() {
		ob_start();
		Admin_Menu::print_hide_core_admin_notices_style();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="jetpack-admin-ui-hide-core-notices"', $output );
		$this->assertStringContainsString( '#wpbody-content > .notice', $output );
		// JITMs render as `.jetpack-jitm-message`; the selector must not match them.
		$this->assertStringNotContainsString( 'jetpack-jitm-message', $output );
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
}

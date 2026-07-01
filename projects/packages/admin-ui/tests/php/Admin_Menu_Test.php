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
		delete_option( 'jetpack_admin_menu_layout' );
		update_option( 'jetpack_options', array( 'id' => 123456 ) );
		if ( self::$admin_user_id ) {
			delete_user_meta( self::$admin_user_id, 'jetpack_admin_menu_layout' );
		}
		$connection = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Manager' )
			->disableOriginalConstructor()
			->getMock();
		$connection->method( 'is_connected' )->willReturn( true );
		$connection->method( 'is_user_connected' )->willReturn( true );
		Admin_Menu::set_connection_manager( $connection );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_filters( 'jetpack_admin_menu_customization_enabled' );
		remove_all_filters( 'jetpack_admin_menu_customization_default_enabled' );
		remove_all_filters( 'jetpack_admin_menu_customization_active' );
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
	 * Metadata passed to add_menu is normalized and exposed for customization.
	 *
	 * @return void
	 */
	public function test_add_menu_accepts_customization_metadata() {
		Admin_Menu::add_menu(
			'Jetpack Forms',
			'Forms',
			'edit_pages',
			'jetpack-forms-admin',
			'__return_null',
			10,
			array(
				'id'          => 'forms',
				'group'       => 'create',
				'group_label' => 'Create',
				'order'       => 20,
				'customizable' => true,
			)
		);

		$items = Admin_Menu::get_registered_menu_items();

		$this->assertSame( 'forms', $items[0]['metadata']['id'] );
		$this->assertSame( 'create', $items[0]['metadata']['group'] );
		$this->assertSame( 'Create', $items[0]['metadata']['group_label'] );
		$this->assertSame( 20, $items[0]['metadata']['order'] );
		$this->assertTrue( $items[0]['metadata']['customizable'] );
	}

	/**
	 * Legacy behavior remains unchanged while customization is unavailable.
	 *
	 * @return void
	 */
	public function test_customization_metadata_does_not_change_legacy_order() {
		wp_set_current_user( self::$admin_user_id );

		Admin_Menu::add_menu(
			'Scan',
			'Scan',
			'manage_options',
			'jetpack-scan',
			'__return_null',
			1,
			array(
				'id'    => 'scan',
				'group' => 'protect',
				'order' => 30,
			)
		);
		Admin_Menu::add_menu(
			'Forms',
			'Forms',
			'edit_pages',
			'jetpack-forms-admin',
			'__return_null',
			10,
			array(
				'id'    => 'forms',
				'group' => 'create',
				'order' => 10,
			)
		);

		do_action( 'admin_menu' );

		$this->assertSame( array( 'jetpack-scan', 'jetpack-forms-admin' ), $this->get_registered_submenu_slugs() );
	}

	/**
	 * Settings remains the last normal submenu item in legacy ordering.
	 *
	 * @return void
	 */
	public function test_settings_is_last_normal_submenu_item_in_legacy_order() {
		wp_set_current_user( self::$admin_user_id );

		Admin_Menu::add_menu( 'Settings', 'Settings', 'manage_options', 'admin.php?page=jetpack#/settings', '__return_null', 1 );
		Admin_Menu::add_menu( 'Backup', 'Backup', 'manage_options', 'jetpack-backup', '__return_null', 50 );
		Admin_Menu::add_menu( 'Activity Log', 'Activity Log', 'manage_options', 'jetpack-activity-log', '__return_null', 100 );

		do_action( 'admin_menu' );

		$this->assertSame(
			array(
				'jetpack-backup',
				'jetpack-activity-log',
				'admin.php?page=jetpack#/settings',
			),
			$this->get_registered_submenu_slugs()
		);
	}

	/**
	 * Active customization uses the recommended grouped order and marks group starts.
	 *
	 * @return void
	 */
	public function test_customization_active_uses_grouped_recommended_order() {
		wp_set_current_user( self::$admin_user_id );
		add_filter( 'jetpack_admin_menu_customization_enabled', '__return_true' );
		Admin_Menu::update_site_menu_layout( array( 'enabled' => true ) );

		Admin_Menu::add_menu( 'Scan', 'Scan', 'manage_options', 'jetpack-scan', '__return_null', 1 );
		Admin_Menu::add_menu( 'Forms', 'Forms', 'edit_pages', 'jetpack-forms-admin', '__return_null', 10 );
		Admin_Menu::add_menu( 'My Jetpack', 'My Jetpack', 'edit_posts', 'my-jetpack', '__return_null', -1 );

		do_action( 'admin_menu' );

		$this->assertSame( array( 'my-jetpack', 'jetpack-forms-admin', 'jetpack-scan' ), $this->get_registered_submenu_slugs() );
		$this->assertSubmenuItemHasClass( 'jetpack-forms-admin', 'jetpack-admin-menu-group-start' );
		$this->assertSubmenuTitleContains( 'jetpack-forms-admin', 'Create' );
		$this->assertSubmenuItemHasClass( 'jetpack-scan', 'jetpack-admin-menu-group-start' );
		$this->assertSubmenuTitleContains( 'jetpack-scan', 'Protect' );
	}

	/**
	 * Settings remains the last normal submenu item when customization is active.
	 *
	 * @return void
	 */
	public function test_settings_is_last_normal_submenu_item_when_customization_active() {
		wp_set_current_user( self::$admin_user_id );
		add_filter( 'jetpack_admin_menu_customization_enabled', '__return_true' );
		Admin_Menu::update_site_menu_layout(
			array(
				'enabled' => true,
				'items'   => array(
					'settings'     => array(
						'group' => 'manage',
						'order' => 1,
					),
					'activity-log' => array(
						'group' => 'utility',
						'order' => 999,
					),
				),
			)
		);

		Admin_Menu::add_menu( 'Settings', 'Settings', 'manage_options', 'admin.php?page=jetpack#/settings', '__return_null', 1 );
		Admin_Menu::add_menu( 'Activity Log', 'Activity Log', 'manage_options', 'jetpack-activity-log', '__return_null', 100 );

		do_action( 'admin_menu' );

		$this->assertSame(
			array(
				'jetpack-activity-log',
				'admin.php?page=jetpack#/settings',
			),
			$this->get_registered_submenu_slugs()
		);

		$all_slugs      = $this->get_registered_submenu_slugs_including_upgrade();
		$settings_index = array_search( 'admin.php?page=jetpack#/settings', $all_slugs, true );
		$upgrade_index  = $this->get_upgrade_submenu_index( $all_slugs );

		$this->assertNotFalse( $settings_index, 'Expected Settings submenu item to be registered.' );
		$this->assertNotNull( $upgrade_index, 'Expected the upgrade menu item to be registered.' );
		$this->assertLessThan( $upgrade_index, $settings_index, 'Expected Settings to appear above the upgrade menu item.' );
	}

	/**
	 * Rollout cohorts can default to the recommended menu without a saved option.
	 *
	 * @return void
	 */
	public function test_default_enabled_filter_activates_customization_without_saved_option() {
		wp_set_current_user( self::$admin_user_id );
		add_filter( 'jetpack_admin_menu_customization_enabled', '__return_true' );
		add_filter( 'jetpack_admin_menu_customization_default_enabled', '__return_true' );

		$this->assertTrue( Admin_Menu::is_customization_active() );
	}

	/**
	 * User preferences can hide customizable items without affecting access control.
	 *
	 * @return void
	 */
	public function test_user_layout_can_hide_customizable_items() {
		wp_set_current_user( self::$admin_user_id );
		add_filter( 'jetpack_admin_menu_customization_enabled', '__return_true' );
		Admin_Menu::update_site_menu_layout( array( 'enabled' => true ) );
		Admin_Menu::update_user_menu_layout(
			array(
				'items' => array(
					'scan' => array(
						'hidden' => true,
					),
				),
			),
			self::$admin_user_id
		);

		Admin_Menu::add_menu( 'Scan', 'Scan', 'manage_options', 'jetpack-scan', '__return_null', 1 );
		Admin_Menu::add_menu( 'Backup', 'Backup', 'manage_options', 'jetpack-backup', '__return_null', 7 );

		do_action( 'admin_menu' );

		$this->assertSame( array( 'jetpack-backup' ), $this->get_registered_submenu_slugs() );
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
	 * Gets currently registered Jetpack submenu slugs, excluding the upgrade item.
	 *
	 * @return array
	 */
	private function get_registered_submenu_slugs() {
		global $submenu;
		$slugs = array_column( $submenu['jetpack'] ?? array(), 2 );

		return array_values(
			array_filter(
				$slugs,
				function ( $slug ) {
					return 'jetpack' !== $slug && false === strpos( $slug, Admin_Menu::UPGRADE_MENU_SLUG );
				}
			)
		);
	}

	/**
	 * Gets currently registered Jetpack submenu slugs, including the upgrade item.
	 *
	 * @return array
	 */
	private function get_registered_submenu_slugs_including_upgrade() {
		global $submenu;
		$slugs = array_column( $submenu['jetpack'] ?? array(), 2 );

		return array_values(
			array_filter(
				$slugs,
				function ( $slug ) {
					return 'jetpack' !== $slug;
				}
			)
		);
	}

	/**
	 * Gets the index of the upgrade item from a submenu slug list.
	 *
	 * @param array $slugs Registered submenu slugs.
	 * @return int|null
	 */
	private function get_upgrade_submenu_index( $slugs ) {
		foreach ( $slugs as $index => $slug ) {
			if ( false !== strpos( $slug, Admin_Menu::UPGRADE_MENU_SLUG ) ) {
				return $index;
			}
		}

		return null;
	}

	/**
	 * Asserts a submenu item has a CSS class.
	 *
	 * @param string $menu_slug The menu slug.
	 * @param string $class     The expected class.
	 * @return void
	 */
	private function assertSubmenuItemHasClass( $menu_slug, $class ) {
		$item = $this->get_submenu_item( $menu_slug );

		$this->assertNotNull( $item, 'Expected submenu item to be registered.' );
		$this->assertStringContainsString( $class, $item[4] ?? '' );
	}

	/**
	 * Asserts a submenu item title contains text.
	 *
	 * @param string $menu_slug The menu slug.
	 * @param string $text      Expected title text.
	 * @return void
	 */
	private function assertSubmenuTitleContains( $menu_slug, $text ) {
		$item = $this->get_submenu_item( $menu_slug );

		$this->assertNotNull( $item, 'Expected submenu item to be registered.' );
		$this->assertStringContainsString( $text, $item[0] );
	}

	/**
	 * Gets a Jetpack submenu item by slug.
	 *
	 * @param string $menu_slug The menu slug.
	 * @return array|null
	 */
	private function get_submenu_item( $menu_slug ) {
		global $submenu;

		foreach ( $submenu['jetpack'] ?? array() as $item ) {
			if ( isset( $item[2] ) && $item[2] === $menu_slug ) {
				return $item;
			}
		}

		return null;
	}
}

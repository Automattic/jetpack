<?php
/**
 * Tests for Atomic_Admin_Menu class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Status;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/data/admin-menu.php';

/**
 * Class Atomic_Admin_Menu_Test.
 *
 * @covers Automattic\Jetpack\Masterbar\Atomic_Admin_Menu
 */
#[CoversClass( Atomic_Admin_Menu::class )]
class Atomic_Admin_Menu_Test extends TestCase {

	/**
	 * Menu data fixture.
	 *
	 * @var array
	 */
	public static $menu_data;

	/**
	 * Submenu data fixture.
	 *
	 * @var array
	 */
	public static $submenu_data;

	/**
	 * Test domain.
	 *
	 * @var string
	 */
	public static $domain;

	/**
	 * Whether this testsuite is run on WP.com.
	 *
	 * @var bool
	 */
	public static $is_wpcom;

	/**
	 * Admin menu instance.
	 *
	 * @var Atomic_Admin_Menu
	 */
	public static $admin_menu;

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $menu, $submenu;

		static::$domain       = ( new Status() )->get_site_suffix();
		static::$menu_data    = get_menu_fixture();
		static::$submenu_data = get_submenu_fixture();

		static::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( static::$user_id );

		// Initialize in set_up so it registers hooks for every test.
		static::$admin_menu = Atomic_Admin_Menu::get_instance();
		$menu               = static::$menu_data;
		$submenu            = static::$submenu_data;
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Tests add_new_site_link.
	 */
	public function test_add_new_site_link() {
		global $menu;

		// Set jetpack user data.
		update_user_option( static::$user_id, 'wpcom_site_count', 1 );

		static::$admin_menu->add_new_site_link();

		$new_site_menu_item = array(
			'Add New Site',
			'read',
			'https://wordpress.com/start?ref=calypso-sidebar',
			'Add New Site',
			'menu-top toplevel_page_https://wordpress.com/start?ref=calypso-sidebar',
			'toplevel_page_https://wordpress.com/start?ref=calypso-sidebar',
			'dashicons-plus-alt',
		);
		$this->assertSame( array_pop( $menu ), $new_site_menu_item );

		delete_user_option( static::$user_id, 'wpcom_site_count' );
	}

	/**
	 * Tests get_preferred_view
	 */
	public function test_get_preferred_view() {
		$this->assertSame( 'classic', static::$admin_menu->get_preferred_view( 'export.php' ) );
	}

	/**
	 * Tests add_users_menu
	 */
	public function test_add_users_menu() {
		global $submenu;

		static::$admin_menu->add_users_menu();
		$this->assertSame( 'https://wordpress.com/people/team/' . static::$domain, $submenu['users.php'][0][2] );
		$this->assertSame( 'user-new.php', $submenu['users.php'][2][2] );
		$this->assertSame( 'profile.php', $submenu['users.php'][3][2] );
	}

	/**
	 * Tests remove_gutenberg_menu
	 */
	public function test_remove_gutenberg_menu() {
		global $menu;
		static::$admin_menu->remove_gutenberg_menu();

		// Gutenberg plugin menu should not be visible.
		$this->assertArrayNotHasKey( 101, $menu );
	}

	/**
	 * Tests add_plugins_menu
	 */
	public function test_add_plugins_menu() {
		global $submenu;
		'@phan-var non-empty-array $submenu';
		$this->assertSame( 'plugin-install.php', $submenu['plugins.php'][10][2] );

		if ( ! is_multisite() ) {
			static::$admin_menu->add_plugins_menu();

			// Make sure that initial menu item is hidden.
			$this->assertSame( 'hide-if-js', $submenu['plugins.php'][1][4] );
			// Make sure that the new menu item is inserted.
			$this->assertSame( 'https://wordpress.com/plugins/' . static::$domain, $submenu['plugins.php'][0][2] );
			// Make sure that Installed Plugins menu item is still in place.
			$this->assertSame( 'plugins.php', $submenu['plugins.php'][2][2] );
		}
	}

	/**
	 * Adds a WooCommerce top-level menu item to the global menu fixture.
	 */
	private function add_woocommerce_menu_item() {
		global $menu;
		$menu[56] = array(
			'WooCommerce',
			'manage_woocommerce',
			'woocommerce',
			'WooCommerce',
			'menu-top toplevel_page_woocommerce',
			'toplevel_page_woocommerce',
			'dashicons-store',
		);
	}

	/**
	 * Builds an Atomic_Admin_Menu whose site purchases are stubbed with the given plan slug.
	 *
	 * @param string $product_slug Product slug to expose as a site purchase.
	 * @return Atomic_Admin_Menu
	 */
	private function admin_menu_with_purchase( $product_slug ) {
		return new class( array( (object) array( 'product_slug' => $product_slug ) ) ) extends Atomic_Admin_Menu {
			/**
			 * Stubbed site purchases.
			 *
			 * @var array
			 */
			private $stub_purchases;

			/**
			 * @param array $stub_purchases Stubbed site purchases.
			 */
			public function __construct( array $stub_purchases ) {
				$this->stub_purchases = $stub_purchases;
			}

			/**
			 * @return array
			 */
			protected function get_site_purchases() {
				return $this->stub_purchases;
			}
		};
	}

	/**
	 * Tests that the WooCommerce menu item is relabeled to "Store setup" on Commerce-plan sites.
	 *
	 * @dataProvider provide_ecommerce_plan_slugs
	 *
	 * @param string $product_slug A Commerce plan product slug.
	 */
	#[DataProvider( 'provide_ecommerce_plan_slugs' )]
	public function test_relabel_woocommerce_menu_on_commerce_plan( $product_slug ) {
		global $menu;

		$this->add_woocommerce_menu_item();

		$this->admin_menu_with_purchase( $product_slug )->relabel_woocommerce_menu();

		$this->assertSame( 'Store setup', $menu[56][0] );
		// The slug is preserved so the menu still points at WooCommerce.
		$this->assertSame( 'woocommerce', $menu[56][2] );
		// Only the sidebar label changes; the page title is left untouched.
		$this->assertSame( 'WooCommerce', $menu[56][3] );
	}

	/**
	 * Tests that the WooCommerce menu item keeps its label on non-Commerce-plan sites.
	 *
	 * Legacy Woo Express plans are included here: those users keep the "WooCommerce" label.
	 *
	 * @dataProvider provide_non_commerce_plan_slugs
	 *
	 * @param string $product_slug A non-Commerce plan product slug.
	 */
	#[DataProvider( 'provide_non_commerce_plan_slugs' )]
	public function test_relabel_woocommerce_menu_keeps_label_without_commerce_plan( $product_slug ) {
		global $menu;

		$this->add_woocommerce_menu_item();

		$this->admin_menu_with_purchase( $product_slug )->relabel_woocommerce_menu();

		$this->assertSame( 'WooCommerce', $menu[56][0] );
	}

	/**
	 * Data provider for Commerce plan slugs.
	 *
	 * @return array<string, array{string}>
	 */
	public static function provide_ecommerce_plan_slugs() {
		return array(
			'Commerce'         => array( 'ecommerce-bundle' ),
			'Commerce monthly' => array( 'ecommerce-bundle-monthly' ),
			'Commerce 2y'      => array( 'ecommerce-bundle-2y' ),
			'Commerce 3y'      => array( 'ecommerce-bundle-3y' ),
			'Commerce trial'   => array( 'ecommerce-trial-bundle-monthly' ),
		);
	}

	/**
	 * Data provider for non-Commerce plan slugs that should keep the "WooCommerce" label.
	 *
	 * @return array<string, array{string}>
	 */
	public static function provide_non_commerce_plan_slugs() {
		return array(
			'Business'          => array( 'business-bundle' ),
			'WooExpress small'  => array( 'wooexpress-small-bundle-yearly' ),
			'WooExpress medium' => array( 'wooexpress-medium-bundle-monthly' ),
		);
	}
}

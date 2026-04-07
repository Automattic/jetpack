<?php
/**
 * Admin Menu Registration
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

use Automattic\Jetpack\Tracking;
use Jetpack_Options;
use Jetpack_Tracks_Client;

/**
 * This class offers a wrapper to add_submenu_page and makes sure stand-alone plugin's menu items are always added under the Jetpack top level menu.
 * If the Jetpack top level was not previously registered by other plugin, it will be registered here.
 */
class Admin_Menu {

	const PACKAGE_VERSION = '0.7.0';

	/**
	 * Slug used for the upgrade menu item and redirect URL.
	 *
	 * Keep the slug in sync with `$upgrade-menu-slug` at admin-ui-upgrade-menu.scss
	 *
	 * @var string
	 */
	const UPGRADE_MENU_SLUG = 'jetpack-wpadmin-sidebar-free-plan-upsell-menu-item';

	/**
	 * Fallback upgrade URL when the Redirect class is unavailable.
	 *
	 * @var string
	 */
	const UPGRADE_MENU_FALLBACK_URL = 'https://jetpack.com/upgrade/';

	/**
	 * Whether this class has been initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * List of menu items enqueued to be added
	 *
	 * @var array
	 */
	private static $menu_items = array();

	/**
	 * Initialize the class and set up the main hook
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			self::handle_akismet_menu();
			add_action( 'admin_menu', array( __CLASS__, 'admin_menu_hook_callback' ), 1000 ); // Jetpack uses 998.
			add_action( 'network_admin_menu', array( __CLASS__, 'admin_menu_hook_callback' ), 1000 ); // Jetpack uses 998.
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'add_upgrade_menu_item_styles' ) );
		}
	}

	/**
	 * Handles the Akismet menu item when used alongside other stand-alone plugins
	 *
	 * When Jetpack plugin is present, Akismet menu item is moved under the Jetpack top level menu, but if Akismet is active alongside other stand-alone plugins,
	 * we use this method to move the menu item.
	 */
	private static function handle_akismet_menu() {
		if ( class_exists( 'Akismet_Admin' ) ) {
			add_action(
				'admin_menu',
				function () {
					// Prevent Akismet from adding a menu item.
					remove_action( 'admin_menu', array( 'Akismet_Admin', 'admin_menu' ), 5 );

					// Add an Anti-spam menu item for Jetpack.
					self::add_menu( __( 'Akismet Anti-spam', 'jetpack-admin-ui' ), __( 'Akismet Anti-spam', 'jetpack-admin-ui' ), 'manage_options', 'akismet-key-config', array( 'Akismet_Admin', 'display_page' ), 6 );
				},
				4
			);

		}
	}

	/**
	 * Callback to the admin_menu and network_admin_menu hooks that will register the enqueued menu items
	 *
	 * @return void
	 */
	public static function admin_menu_hook_callback() {
		$can_see_toplevel_menu  = true;
		$jetpack_plugin_present = class_exists( 'Jetpack_React_Page' );
		$icon                   = method_exists( '\Automattic\Jetpack\Assets\Logo', 'get_base64_logo' )
			? ( new \Automattic\Jetpack\Assets\Logo() )->get_base64_logo()
			: 'dashicons-admin-plugins';

		if ( ! $jetpack_plugin_present ) {
			add_menu_page(
				'Jetpack',
				'Jetpack',
				'edit_posts',
				'jetpack',
				'__return_null',
				$icon,
				3
			);

			// If Jetpack plugin is not present, user will only be able to see this menu if they have enough capability to at least one of the sub menus being added.
			$can_see_toplevel_menu = false;
		}

		/**
		 * The add_sub_menu function has a bug and will not keep the right order of menu items.
		 *
		 * @see https://core.trac.wordpress.org/ticket/52035
		 * Let's order the items before registering them.
		 * Since this all happens after the Jetpack plugin menu items were added, all items will be added after Jetpack plugin items - unless position is very low number (smaller than the number of menu items present in Jetpack plugin).
		 */
		usort(
			self::$menu_items,
			function ( $a, $b ) {
				$position_a = empty( $a['position'] ) ? 0 : $a['position'];
				$position_b = empty( $b['position'] ) ? 0 : $b['position'];
				$result     = $position_a <=> $position_b;

				if ( 0 === $result ) {
					$result = strcmp( $a['menu_title'], $b['menu_title'] );
				}

				return $result;
			}
		);

		foreach ( self::$menu_items as $menu_item ) {
			if ( ! current_user_can( $menu_item['capability'] ) ) {
				continue;
			}

			$can_see_toplevel_menu = true;

			add_submenu_page(
				'jetpack',
				$menu_item['page_title'],
				$menu_item['menu_title'],
				$menu_item['capability'],
				$menu_item['menu_slug'],
				$menu_item['function'],
				$menu_item['position']
			);
		}

		if ( ! $jetpack_plugin_present ) {
			remove_submenu_page( 'jetpack', 'jetpack' );
		}

		if ( ! $can_see_toplevel_menu ) {
			remove_menu_page( 'jetpack' );
		}

		self::maybe_add_upgrade_menu_item();
	}

	/**
	 * Adds a new submenu to the Jetpack Top level menu
	 *
	 * The parameters this method accepts are the same as @see add_submenu_page. This class will
	 * aggreagate all menu items registered by stand-alone plugins and make sure they all go under the same
	 * Jetpack top level menu. It will also handle the top level menu registration in case the Jetpack plugin is not present.
	 *
	 * @param string        $page_title  The text to be displayed in the title tags of the page when the menu
	 *                                   is selected.
	 * @param string        $menu_title  The text to be used for the menu.
	 * @param string        $capability  The capability required for this menu to be displayed to the user.
	 * @param string        $menu_slug   The slug name to refer to this menu by. Should be unique for this menu
	 *                                   and only include lowercase alphanumeric, dashes, and underscores characters
	 *                                   to be compatible with sanitize_key().
	 * @param callable|null $function    The function to be called to output the content for this page.
	 * @param int           $position    The position in the menu order this item should appear. Leave empty typically.
	 *
	 * @return string The resulting page's hook_suffix
	 */
	public static function add_menu( $page_title, $menu_title, $capability, $menu_slug, $function, $position = null ) {
		self::init();
		self::$menu_items[] = compact( 'page_title', 'menu_title', 'capability', 'menu_slug', 'function', 'position' );

		/**
		 * Let's return the page hook so consumers can use.
		 * We know all pages will be under Jetpack top level menu page, so we can hardcode the first part of the string.
		 * Using get_plugin_page_hookname here won't work because the top level page is not registered yet.
		 */
		return 'jetpack_page_' . $menu_slug;
	}

	/**
	 * Removes an already added submenu
	 *
	 * @param string $menu_slug   The slug of the submenu to remove.
	 *
	 * @return array|false The removed submenu on success, false if not found.
	 */
	public static function remove_menu( $menu_slug ) {

		foreach ( self::$menu_items as $index => $menu_item ) {
			if ( $menu_item['menu_slug'] === $menu_slug ) {
				unset( self::$menu_items[ $index ] );

				return $menu_item;
			}
		}

		return false;
	}

	/**
	 * Gets the slug for the first item under the Jetpack top level menu
	 *
	 * @return string|null
	 */
	public static function get_top_level_menu_item_slug() {
		global $submenu;
		if ( ! empty( $submenu['jetpack'] ) ) {
			$item = reset( $submenu['jetpack'] );
			if ( isset( $item[2] ) ) {
				return $item[2];
			}
		}
	}

	/**
	 * Gets the URL for the first item under the Jetpack top level menu
	 *
	 * @param string $fallback If Jetpack menu is not there or no children is found, return this fallback instead. Default to admin_url().
	 * @return string
	 */
	public static function get_top_level_menu_item_url( $fallback = false ) {
		$slug = self::get_top_level_menu_item_slug();

		if ( $slug ) {
			$url = menu_page_url( $slug, false );
			return $url;
		}

		$url = $fallback ? $fallback : admin_url();
		return $url;
	}

	/**
	 * Checks whether the current site should show the upgrade menu item.
	 *
	 * The upgrade menu is only shown to administrators on free-plan sites
	 * that are not hosted on WordPress.com.
	 *
	 * @return bool True if the upgrade menu should be shown.
	 */
	private static function should_show_upgrade_menu() {

		// Only show to administrators.
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		// Don't show upsells on WordPress.com platform.
		if ( class_exists( '\Automattic\Jetpack\Status\Host' ) ) {
			$host = new \Automattic\Jetpack\Status\Host();
			if ( $host->is_wpcom_platform() ) {
				return false;
			}
		}

		// Only show to free-plan sites.
		return self::is_free_plan();
	}

	/**
	 * Checks whether the current site is on a free Jetpack plan with no active paid license.
	 *
	 * @return bool True if the site has no paid plan.
	 */
	private static function is_free_plan() {
		// Check the active plan - use the is_free field or product_slug.
		$plan = get_option( 'jetpack_active_plan', array() );

		// Back-compat: older plan payloads use class to indicate paid plans.
		if ( isset( $plan['class'] ) && 'free' !== $plan['class'] ) {
			return false;
		}

		// If the plan explicitly says it's not free, trust that.
		if ( isset( $plan['is_free'] ) && false === $plan['is_free'] ) {
			return false;
		}

		// Check if the product slug indicates a paid plan.
		if ( isset( $plan['product_slug'] ) && 'jetpack_free' !== $plan['product_slug'] ) {
			return false;
		}

		// Also check for site products (licenses can add products without changing plan).
		$products = get_option( 'jetpack_site_products', array() );
		if ( ! empty( $products ) && is_array( $products ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Conditionally adds an "Upgrade Jetpack" submenu item for free-plan sites.
	 *
	 * Only shown to users with manage_options capability on self-hosted sites without a paid Jetpack plan or license.
	 *
	 * @return void
	 */
	private static function maybe_add_upgrade_menu_item() {
		if ( ! self::should_show_upgrade_menu() ) {
			return;
		}

		$upgrade_url = class_exists( '\Automattic\Jetpack\Redirect' )
			? \Automattic\Jetpack\Redirect::get_url( self::UPGRADE_MENU_SLUG )
			: self::UPGRADE_MENU_FALLBACK_URL;

		$menu_title = esc_html__( 'Upgrade Jetpack', 'jetpack-admin-ui' );

		add_submenu_page(
			'jetpack',
			$menu_title,
			$menu_title,
			'manage_options',
			esc_url( $upgrade_url ),
			null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			999
		);

		// Add a CSS class to the <li> element so styles can target it precisely.
		global $submenu;
		if ( ! empty( $submenu['jetpack'] ) ) {
			foreach ( $submenu['jetpack'] as $index => $item ) {
				if ( isset( $item[2] ) && false !== strpos( $item[2], self::UPGRADE_MENU_SLUG ) ) {
					// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
					$submenu['jetpack'][ $index ][4] = ( ! empty( $item[4] ) ? $item[4] . ' ' : '' ) . self::UPGRADE_MENU_SLUG;
					break;
				}
			}
		}
	}

	/**
	 * Enqueues admin styles for the "Upgrade Jetpack" menu item.
	 *
	 * The sidebar menu is visible on every admin page, so styles load globally.
	 * Only enqueues for free-plan sites on self-hosted installs.
	 *
	 * @return void
	 */
	public static function add_upgrade_menu_item_styles() {
		if ( ! self::should_show_upgrade_menu() ) {
			return;
		}

		$asset_file = dirname( __DIR__ ) . '/build/admin-ui-upgrade-menu.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : array();

		wp_enqueue_style(
			'jetpack-admin-ui-upgrade-menu',
			plugins_url( '../build/admin-ui-upgrade-menu.css', __FILE__ ),
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? self::PACKAGE_VERSION
		);

		self::enqueue_upgrade_menu_tracks_script( $asset );
	}

	/**
	 * Enqueues Tracks for the upgrade submenu item.
	 *
	 * @param array $asset Parsed contents of admin-ui-upgrade-menu.asset.php.
	 * @return void
	 */
	private static function enqueue_upgrade_menu_tracks_script( $asset ) {
		if ( ! class_exists( '\Automattic\Jetpack\Tracking' ) ) {
			return;
		}

		Tracking::register_tracks_functions_scripts( true );

		wp_enqueue_script(
			'jetpack-admin-ui-upgrade-menu-tracking',
			plugins_url( '../build/admin-ui-upgrade-menu-tracking.js', __FILE__ ),
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? self::PACKAGE_VERSION,
			true
		);

		$current_screen   = get_current_screen();
		$is_admin         = current_user_can( 'jetpack_disconnect' );
		$site_id          = class_exists( 'Jetpack_Options' ) ? Jetpack_Options::get_option( 'id' ) : null;
		$tracks_user_data = class_exists( 'Jetpack_Tracks_Client' ) ? Jetpack_Tracks_Client::get_connected_user_tracks_identity() : null;

		wp_localize_script(
			'jetpack-admin-ui-upgrade-menu-tracking',
			'jetpackAdminUiUpgradeMenu',
			array(
				'menuItemClass'   => self::UPGRADE_MENU_SLUG,
				'tracksUserData'  => $tracks_user_data,
				'tracksEventData' => array(
					'is_admin'       => $is_admin,
					'current_screen' => $current_screen ? $current_screen->id : false,
					'blog_id'        => $site_id,
				),
			)
		);
	}
}

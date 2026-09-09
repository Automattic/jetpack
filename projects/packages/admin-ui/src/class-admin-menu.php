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

	const PACKAGE_VERSION = '0.11.2';

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

	/*
	 * The sidebar's five tiers. Items sharing a tier sort alphabetically by menu title, so a
	 * product should pass no position at all and land in POSITION_DEFAULT. Reach for another
	 * tier only to express one of the roles below — an int of your own silently opts the item
	 * out of alphabetical order, which is how three curation efforts overwrote it before.
	 */

	/**
	 * Owns the top-level Jetpack link, since WordPress points it at whichever item sorts first.
	 *
	 * @var int
	 */
	const POSITION_FIRST = -10;

	/**
	 * Takes the first slot when nothing claims POSITION_FIRST, as in offline mode.
	 *
	 * @var int
	 */
	const POSITION_FIRST_FALLBACK = -5;

	/**
	 * Products, in alphabetical order. Pass no position rather than this.
	 *
	 * @var int
	 */
	const POSITION_DEFAULT = 0;

	/**
	 * Links that leave wp-admin, grouped below the products.
	 *
	 * @var int
	 */
	const POSITION_EXTERNAL = 100;

	/**
	 * Site-level items that belong under everything else.
	 *
	 * @var int
	 */
	const POSITION_LAST = 998;

	/**
	 * The upgrade item this package adds, below every tier a caller can use.
	 *
	 * @var int
	 */
	const POSITION_UPGRADE = 999;

	/**
	 * Handle for the shared, token-only WPDS design-tokens stylesheet.
	 *
	 * Registered once and enqueued on every Jetpack admin page so that
	 * `var(--wpds-*)` values resolve at runtime instead of falling back to
	 * their hand-written hex defaults.
	 *
	 * @var string
	 */
	const DESIGN_TOKENS_HANDLE = 'jetpack-admin-ui-design-tokens';

	/**
	 * Handle for the source-less stylesheet that hides WordPress core admin notices.
	 *
	 * @var string
	 */
	const HIDE_CORE_NOTICES_HANDLE = 'jetpack-admin-ui-hide-core-notices';

	/**
	 * Visibility state: show the item only when its declared gate is satisfied.
	 *
	 * @var string
	 */
	const VISIBILITY_DEFAULT = 'default';

	/**
	 * Visibility state: show the item whatever its gate says.
	 *
	 * @var string
	 */
	const VISIBILITY_VISIBLE = 'visible';

	/**
	 * Visibility state: keep the item out whatever its gate says.
	 *
	 * @var string
	 */
	const VISIBILITY_HIDDEN = 'hidden';

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
	 * Hook suffixes of the pages registered through this class.
	 *
	 * Used to scope the design-tokens stylesheet to Jetpack admin pages.
	 *
	 * @var array
	 */
	private static $page_hooks = array();

	/**
	 * Optional connection manager dependency.
	 *
	 * @var object|null
	 */
	private static $connection_manager = null;

	/**
	 * Callback that answers whether a menu item's declared gate is satisfied.
	 *
	 * Set by My Jetpack, which owns the product classes the gates are expressed in.
	 * This package deliberately does not depend on My Jetpack: My Jetpack already
	 * depends on this one, and not every plugin bundling admin-ui bundles it.
	 *
	 * @var callable|null
	 */
	private static $visibility_resolver = null;

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
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_design_tokens' ) );
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
					self::add_menu( __( 'Akismet Anti-spam', 'jetpack-admin-ui' ), __( 'Akismet Anti-spam', 'jetpack-admin-ui' ), 'manage_options', 'akismet-key-config', array( 'Akismet_Admin', 'display_page' ) );
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
		$icon                   = 'dashicons-admin-plugins';
		if ( method_exists( '\Automattic\Jetpack\Assets\Logo', 'get_base64_admin_menu_logo' ) ) {
			$icon = ( new \Automattic\Jetpack\Assets\Logo() )->get_base64_admin_menu_logo();
		} elseif ( method_exists( '\Automattic\Jetpack\Assets\Logo', 'get_base64_logo' ) ) {
			$icon = ( new \Automattic\Jetpack\Assets\Logo() )->get_base64_logo();
		}

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
					// Case-insensitive and number-aware, so "eCommerce" sorts with the Es.
					// Still a byte compare: a leading accented character sorts after Z.
					$result = strnatcasecmp( $a['menu_title'], $b['menu_title'] );
				}

				return $result;
			}
		);

		$visibility = self::get_visibility_states();

		foreach ( self::$menu_items as $menu_item ) {
			/*
			 * Neither check can expose a page: add_submenu_page() refuses one the user lacks the
			 * capability for, whatever we pass it. Both run here so that an item the user cannot
			 * see, or a host has hidden, does not keep the empty Jetpack top level menu alive.
			 */
			if ( ! current_user_can( $menu_item['capability'] ) ) {
				continue;
			}

			if ( ! self::is_menu_item_visible( $menu_item, $visibility ) ) {
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
	 * @param int|null      $position    The position in the menu order this item should appear. Leave empty typically.
	 * @param array         $args        Optional. Visibility declaration for this item:
	 *                                   - 'product' (string) My Jetpack product slug whose activation gates the item.
	 *                                   - 'module'  (string) Jetpack module name, for items with no product class.
	 *                                   - 'key'     (string) The name hosts use for this item in the visibility
	 *                                                        filter. Declare one on every item: menu slugs are
	 *                                                        sometimes URLs, sometimes filterable, and sometimes
	 *                                                        differ between two registrations of the same item.
	 *                                                        Falls back to $menu_slug when absent.
	 *                                   An item that declares no gate is always shown.
	 *
	 * @return string The resulting page's hook_suffix
	 */
	public static function add_menu( $page_title, $menu_title, $capability, $menu_slug, $function, $position = null, $args = array() ) {
		self::init();
		self::$menu_items[] = compact( 'page_title', 'menu_title', 'capability', 'menu_slug', 'function', 'position', 'args' );

		/**
		 * Let's return the page hook so consumers can use.
		 * We know all pages will be under Jetpack top level menu page, so we can hardcode the first part of the string.
		 * Using get_plugin_page_hookname here won't work because the top level page is not registered yet.
		 */
		$hook = 'jetpack_page_' . $menu_slug;

		// Track the page hook so the design-tokens stylesheet can be scoped to it.
		self::$page_hooks[] = $hook;

		// Hide WordPress core admin notices on this Jetpack page. The load-<hook>
		// action only fires when the matching screen is being rendered, so this
		// stays scoped to Jetpack pages and reaches every page registered here.
		add_action( 'load-' . $hook, array( __CLASS__, 'hide_core_admin_notices' ) );
		add_action( 'load-' . $hook . '-network', array( __CLASS__, 'hide_core_admin_notices' ) );

		return $hook;
	}

	/**
	 * Enqueues the stylesheet that hides WordPress core admin notices on the current Jetpack page.
	 *
	 * Hooked from the page's load-<hook> action so it only runs on Jetpack screens. That action
	 * runs before admin_enqueue_scripts, so the handle is queued in time to be printed.
	 *
	 * @return void
	 */
	public static function hide_core_admin_notices() {
		// wp_add_inline_style() appends, so the CSS is attached only while the handle is new to the request.
		if ( ! wp_style_is( self::HIDE_CORE_NOTICES_HANDLE, 'registered' ) ) {
			wp_register_style( self::HIDE_CORE_NOTICES_HANDLE, false, array(), self::PACKAGE_VERSION );
			wp_add_inline_style( self::HIDE_CORE_NOTICES_HANDLE, self::get_hide_core_admin_notices_styles() );
		}

		wp_enqueue_style( self::HIDE_CORE_NOTICES_HANDLE );
	}

	/**
	 * Enqueues the CSS that hides WordPress core admin notices.
	 *
	 * Callers must run this before WordPress flushes the style queue in
	 * print_admin_styles() (admin_print_styles, priority 20). Later than that,
	 * the handle is never printed. The previous admin_print_styles priority-10
	 * hook still works.
	 *
	 * @deprecated 0.10.0 Use hide_core_admin_notices(), which enqueues the CSS.
	 *
	 * @return void
	 */
	public static function print_hide_core_admin_notices_style() {
		_deprecated_function( __METHOD__, 'admin-ui-0.10.0', __CLASS__ . '::hide_core_admin_notices' );
		self::hide_core_admin_notices();
	}

	/**
	 * Gets the CSS that hides WordPress core admin notices.
	 *
	 * We only target direct children of #wpbody-content (where core renders notices via the
	 * admin_notices / all_admin_notices hooks). This intentionally leaves JITMs untouched —
	 * they output `.jetpack-jitm-message`, not `.notice` — and leaves in-app/React notices
	 * untouched, since those render deeper inside `.wrap`. The CSS rides on a source-less
	 * handle rather than a build asset so it also reaches older Jetpack pages that ship no
	 * stylesheet of their own.
	 *
	 * @return string CSS rules.
	 */
	private static function get_hide_core_admin_notices_styles() {
		return '
		#wpbody-content > .notice,
		#wpbody-content > .update-nag,
		#wpbody-content > .updated,
		#wpbody-content > .error { display: none !important; }
		';
	}

	/**
	 * Sets the callback that resolves a menu item's declared gate.
	 *
	 * The callback receives the item's $args array and returns true (gate satisfied),
	 * false (not satisfied), or null when it cannot answer — an unknown product slug,
	 * for instance. Null is treated as satisfied, so a gate this package cannot resolve
	 * never removes a menu item.
	 *
	 * This is the seam My Jetpack fills. Hosts wanting to shape the sidebar should use the
	 * `jetpack_admin_menu_visibility` filter instead, which runs after whatever this answers.
	 *
	 * @param callable|null $resolver Resolver callback, or null to clear it.
	 * @return void
	 */
	public static function set_visibility_resolver( $resolver ) {
		self::$visibility_resolver = $resolver;
	}

	/**
	 * Returns the name a host uses for a menu item in the visibility filter.
	 *
	 * The menu slug is only a fallback. It is the wrong thing to hand a host as an identifier:
	 * several items register a URL as their slug, Blaze's is filterable, and VideoPress swaps
	 * between two slugs depending on whether the module is active — so a host naming one of
	 * them is naming a moving target, or only half an item.
	 *
	 * @param array $menu_item A registered menu item.
	 * @return string
	 */
	private static function get_item_key( array $menu_item ) {
		if ( ! empty( $menu_item['args']['key'] ) ) {
			return (string) $menu_item['args']['key'];
		}

		return (string) $menu_item['menu_slug'];
	}

	/**
	 * Builds the item => state map and hands it to hosts to amend.
	 *
	 * @return array Map of item key to one of the VISIBILITY_* states.
	 */
	private static function get_visibility_states() {
		$states = array();

		foreach ( self::$menu_items as $menu_item ) {
			$states[ self::get_item_key( $menu_item ) ] = self::VISIBILITY_DEFAULT;
		}

		/**
		 * Filters which Jetpack items appear in the wp-admin sidebar.
		 *
		 * Each item resolves to one of three states: 'default' derives visibility from whether
		 * the item's feature is active, 'visible' forces it in, and 'hidden' keeps it out. A
		 * host names only the items it cares about; anything it leaves alone stays 'default'.
		 *
		 * The whole map is passed at once so that two mu-plugins setting different keys merge
		 * rather than clobber each other. 'visible' does not override the capability check —
		 * a user who cannot see a page will not be shown it by this filter.
		 *
		 * Only items registered through Admin_Menu::add_menu() appear here. Anything added with
		 * a bare add_submenu_page() is outside this filter's reach.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $states     Map of item key (menu slug unless the item declared one) to state.
		 * @param array $menu_items The registered menu items, for context.
		 */
		$states = apply_filters( 'jetpack_admin_menu_visibility', $states, self::$menu_items );

		return is_array( $states ) ? $states : array();
	}

	/**
	 * Decides whether a single menu item should be registered.
	 *
	 * @param array $menu_item  A registered menu item.
	 * @param array $visibility The resolved state map from get_visibility_states().
	 * @return bool
	 */
	private static function is_menu_item_visible( array $menu_item, array $visibility ) {
		$key   = self::get_item_key( $menu_item );
		$state = $visibility[ $key ] ?? self::VISIBILITY_DEFAULT;

		if ( self::VISIBILITY_HIDDEN === $state ) {
			return false;
		}

		if ( self::VISIBILITY_VISIBLE === $state ) {
			return true;
		}

		return self::is_gate_satisfied( $menu_item['args'] ?? array() );
	}

	/**
	 * Asks the resolver whether an item's declared gate is satisfied.
	 *
	 * Everything here fails open. An item that declares no gate, a site with no resolver
	 * registered, and a gate the resolver does not recognize all keep the item in the
	 * sidebar, so adopting this mechanism cannot remove an item nobody asked it to.
	 *
	 * @param array $args The item's visibility declaration.
	 * @return bool
	 */
	private static function is_gate_satisfied( array $args ) {
		if ( ! isset( $args['product'] ) && ! isset( $args['module'] ) ) {
			return true;
		}

		if ( ! is_callable( self::$visibility_resolver ) ) {
			return true;
		}

		$resolved = call_user_func( self::$visibility_resolver, $args );

		return null === $resolved ? true : (bool) $resolved;
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

		// Don't show upsells in offline/development mode.
		if ( class_exists( '\Automattic\Jetpack\Status' ) ) {
			$status = new \Automattic\Jetpack\Status();
			if ( $status->is_offline_mode() ) {
				return false;
			}
		}

		// Only show after the site and current user are connected.
		if ( ! self::is_site_and_user_connected() ) {
			return false;
		}

		// Only show to free-plan sites.
		return self::is_free_plan();
	}

	/**
	 * Checks whether the site and current user are connected to WordPress.com.
	 *
	 * @return bool True if site and current user are connected.
	 */
	private static function is_site_and_user_connected() {
		$connection_manager = self::$connection_manager;
		if ( ! $connection_manager && class_exists( '\Automattic\Jetpack\Connection\Manager' ) ) {
			$connection_manager       = new \Automattic\Jetpack\Connection\Manager();
			self::$connection_manager = $connection_manager;
		}

		if (
			$connection_manager
			&& is_callable( array( $connection_manager, 'is_connected' ) )
			&& is_callable( array( $connection_manager, 'is_user_connected' ) )
		) {
			return (bool) $connection_manager->is_connected()
				&& (bool) $connection_manager->is_user_connected( get_current_user_id() );
		}

		return false;
	}

	/**
	 * Sets the connection manager dependency; used by tests.
	 *
	 * @param object|null $connection_manager Connection manager object.
	 * @return void
	 */
	public static function set_connection_manager( $connection_manager ) {
		self::$connection_manager = $connection_manager;
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
			self::POSITION_UPGRADE
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
	 * Enqueues the shared, token-only WPDS design-tokens stylesheet.
	 *
	 * Single entry point for any consumer that needs WPDS `var(--wpds-*)` values
	 * to resolve at runtime on a Jetpack admin page. Registers the handle on
	 * first use (idempotent) and enqueues it; the caller is responsible for
	 * scoping the call to the right page(s). Since admin-ui is a dependency of
	 * the Jetpack plugin and the modernized packages, both the plugin's
	 * legacy/wrap_ui gate and this package's own dashboards call through here,
	 * so the handle has a single owner and there is no duplicated enqueue logic.
	 *
	 * @return void
	 */
	public static function enqueue_design_tokens() {
		self::register_design_tokens_style();
		wp_enqueue_style( self::DESIGN_TOKENS_HANDLE );
	}

	/**
	 * Registers the shared, token-only WPDS design-tokens stylesheet.
	 *
	 * The stylesheet only defines `:root{--wpds-*}` custom properties (no
	 * component or class styles), giving every Jetpack admin page a single
	 * runtime source for design tokens. It is safe to call repeatedly:
	 * wp_register_style() is a no-op once the handle is registered.
	 *
	 * @return void
	 */
	private static function register_design_tokens_style() {
		if ( wp_style_is( self::DESIGN_TOKENS_HANDLE, 'registered' ) ) {
			return;
		}

		$asset_file = dirname( __DIR__ ) . '/build/design-tokens.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : array();

		wp_register_style(
			self::DESIGN_TOKENS_HANDLE,
			plugins_url( '../build/design-tokens.css', __FILE__ ),
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? self::PACKAGE_VERSION
		);
	}

	/**
	 * Enqueues the design tokens on the pages registered through this class.
	 *
	 * This is the admin_enqueue_scripts callback for the modernized Jetpack
	 * dashboards. Scoped to self::$page_hooks so the tokens load wherever a
	 * modernized dashboard renders, regardless of plan or connection state; the
	 * actual enqueue is delegated to the reusable enqueue_design_tokens() API.
	 *
	 * @param string $hook_suffix The current admin page's hook suffix.
	 * @return void
	 */
	public static function maybe_enqueue_design_tokens( $hook_suffix ) {
		if ( ! in_array( $hook_suffix, self::$page_hooks, true ) ) {
			return;
		}

		self::enqueue_design_tokens();
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

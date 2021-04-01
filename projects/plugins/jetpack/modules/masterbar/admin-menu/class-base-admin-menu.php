<?php
/**
 * Base Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Status;

/**
 * Class Base_Admin_Menu
 */
abstract class Base_Admin_Menu {
	/**
	 * Holds class instances.
	 *
	 * @var array
	 */
	protected static $instances;

	/**
	 * Whether the current request is a REST API request.
	 *
	 * @var bool
	 */
	protected $is_api_request = false;

	/**
	 * Domain of the current site.
	 *
	 * @var string
	 */
	protected $domain;

	/**
	 * Base_Admin_Menu constructor.
	 */
	protected function __construct() {
		add_action( 'admin_menu', array( $this, 'set_is_api_request' ), 99998 );
		add_action( 'admin_menu', array( $this, 'reregister_menu_items' ), 99999 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_filter( 'rest_request_before_callbacks', array( $this, 'rest_api_init' ), 11 );

		$this->domain = ( new Status() )->get_site_suffix();
	}

	/**
	 * Determine if the current request is from API
	 */
	public function set_is_api_request() {
		// Constant is not defined until parse_request.
		if ( ! $this->is_api_request ) {
			$this->is_api_request = defined( 'REST_REQUEST' ) && REST_REQUEST;
		}
	}

	/**
	 * Returns class instance.
	 *
	 * @return Admin_Menu
	 */
	public static function get_instance() {
		$class = get_called_class();

		if ( empty( static::$instances[ $class ] ) ) {
			static::$instances[ $class ] = new $class();
		}

		return static::$instances[ $class ];
	}

	/**
	 * Sets up class properties for REST API requests.
	 *
	 * @param \WP_REST_Response $response Response from the endpoint.
	 */
	public function rest_api_init( $response ) {
		$this->is_api_request = true;

		return $response;
	}

	/**
	 * Updates the menu data of the given menu slug.
	 *
	 * @param string $slug Slug of the menu to update.
	 * @param string $url New menu URL.
	 * @param string $title New menu title.
	 * @param string $cap New menu capability.
	 * @param string $icon New menu icon.
	 * @param int    $position New menu position.
	 * @return bool Whether the menu has been updated.
	 */
	public function update_menu( $slug, $url = null, $title = null, $cap = null, $icon = null, $position = null ) {
		global $menu, $submenu;

		$menu_item     = null;
		$menu_position = null;

		foreach ( $menu as $i => $item ) {
			if ( $slug === $item[2] ) {
				$menu_item     = $item;
				$menu_position = $i;
				break;
			}
		}

		if ( ! $menu_item ) {
			return false;
		}

		if ( $title ) {
			$menu_item[0] = $title;
			$menu_item[3] = esc_attr( $title );
		}

		if ( $cap ) {
			$menu_item[1] = $cap;
		}

		// Change parent slug only if there are no submenus (the slug of the 1st submenu will be used if there are submenus).
		if ( $url ) {
			remove_submenu_page( $slug, $slug );
			if ( empty( $submenu[ $slug ] ) ) {
				$menu_item[2] = $url;
			}
		}

		if ( $icon ) {
			$menu_item[4] = 'menu-top';
			$menu_item[6] = $icon;
		}

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		unset( $menu[ $menu_position ] );
		if ( $position ) {
			$menu_position = $position;
		}
		$this->set_menu_item( $menu_item, $menu_position );

		// Only add submenu when there are other submenu items.
		if ( $url && ! empty( $submenu[ $slug ] ) ) {
			add_submenu_page( $slug, $menu_item[3], $menu_item[0], $menu_item[1], $url, null, 0 );
		}

		return true;
	}

	/**
	 * Updates the submenus of the given menu slug.
	 *
	 * @param string $slug Menu slug.
	 * @param array  $submenus_to_update Array of new submenu slugs.
	 */
	public function update_submenus( $slug, $submenus_to_update ) {
		global $submenu;

		if ( ! isset( $submenu[ $slug ] ) ) {
			return;
		}

		foreach ( $submenu[ $slug ] as $i => $submenu_item ) {
			if ( array_key_exists( $submenu_item[2], $submenus_to_update ) ) {
				$submenu_item[2] = $submenus_to_update[ $submenu_item[2] ];
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu[ $slug ][ $i ] = $submenu_item;
			}
		}
	}

	/**
	 * Adds a menu separator.
	 *
	 * @param int    $position The position in the menu order this item should appear.
	 * @param string $cap Optional. The capability required for this menu to be displayed to the user.
	 *                         Default: 'read'.
	 */
	public function add_admin_menu_separator( $position = null, $cap = 'read' ) {
		$menu_item = array(
			'',                                  // Menu title (ignored).
			$cap,                                // Required capability.
			wp_unique_id( 'separator-custom-' ), // URL or file (ignored, but must be unique).
			'',                                  // Page title (ignored).
			'wp-menu-separator',                 // CSS class. Identifies this item as a separator.
		);

		$this->set_menu_item( $menu_item, $position );
	}

	/**
	 * Enqueues scripts and styles.
	 */
	public function enqueue_scripts() {
		$is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;

		if ( $this->is_rtl() ) {
			if ( $is_wpcom ) {
				$css_path = 'rtl/admin-menu-rtl.css';
			} else {
				$css_path = 'admin-menu-rtl.css';
			}
		} else {
			$css_path = 'admin-menu.css';
		}

		wp_enqueue_style(
			'jetpack-admin-menu',
			plugins_url( $css_path, __FILE__ ),
			array(),
			JETPACK__VERSION
		);

		wp_enqueue_script(
			'jetpack-admin-menu',
			plugins_url( 'admin-menu.js', __FILE__ ),
			array(),
			JETPACK__VERSION,
			true
		);
	}

	/**
	 * Adds the given menu item in the specified position.
	 *
	 * @param array $item The menu item to add.
	 * @param int   $position The position in the menu order this item should appear.
	 */
	public function set_menu_item( $item, $position = null ) {
		global $menu;

		// Handle position (avoids overwriting menu items already populated in the given position).
		// Inspired by https://core.trac.wordpress.org/browser/trunk/src/wp-admin/menu.php?rev=49837#L160.
		if ( null === $position ) {
			$menu[] = $item; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		} elseif ( isset( $menu[ "$position" ] ) ) {
			$position            = $position + substr( base_convert( md5( $item[2] . $item[0] ), 16, 10 ), -5 ) * 0.00001;
			$menu[ "$position" ] = $item; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		} else {
			$menu[ $position ] = $item; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}
	}

	/**
	 * Determines whether the current locale is right-to-left (RTL).
	 */
	public function is_rtl() {
		return is_rtl();
	}

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * Options:
	 * false - Calypso (Default).
	 * true  - wp-admin.
	 *
	 * @return bool
	 */
	abstract public function should_link_to_wp_admin();

	/**
	 * Create the desired menu output.
	 */
	abstract public function reregister_menu_items();
}

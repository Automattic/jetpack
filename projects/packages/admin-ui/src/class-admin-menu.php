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

	const PACKAGE_VERSION = '0.8.6';

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
	 * Site option storing the admin menu layout.
	 *
	 * @var string
	 */
	const CUSTOMIZATION_SITE_OPTION = 'jetpack_admin_menu_layout';

	/**
	 * User meta key storing personal admin menu preferences.
	 *
	 * @var string
	 */
	const CUSTOMIZATION_USER_META = 'jetpack_admin_menu_layout';

	/**
	 * Filter that enables the customization feature for rollout testing.
	 *
	 * @var string
	 */
	const CUSTOMIZATION_FEATURE_FILTER = 'jetpack_admin_menu_customization_enabled';

	/**
	 * Filter that lets new installs or rollout cohorts default to the recommended menu.
	 *
	 * @var string
	 */
	const CUSTOMIZATION_DEFAULT_ENABLED_FILTER = 'jetpack_admin_menu_customization_default_enabled';

	/**
	 * Filter that lets hosts/cohorts override whether customization is currently active.
	 *
	 * @var string
	 */
	const CUSTOMIZATION_ACTIVE_FILTER = 'jetpack_admin_menu_customization_active';

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
	 * Optional connection manager dependency.
	 *
	 * @var object|null
	 */
	private static $connection_manager = null;

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
		$menu_items = self::get_menu_items_for_registration();

		foreach ( $menu_items as $menu_item ) {
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

			if ( ! empty( $menu_item['classes'] ) ) {
				self::add_submenu_item_classes( $menu_item['menu_slug'], $menu_item['classes'] );
			}
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
	 * @param array         $metadata    Optional menu customization metadata.
	 *
	 * @return string The resulting page's hook_suffix
	 */
	public static function add_menu( $page_title, $menu_title, $capability, $menu_slug, $function, $position = null, $metadata = array() ) {
		self::init();
		$menu_item             = compact( 'page_title', 'menu_title', 'capability', 'menu_slug', 'function', 'position' );
		$menu_item['metadata'] = self::normalize_menu_metadata( $menu_item, $metadata );
		self::$menu_items[]    = $menu_item;

		/**
		 * Let's return the page hook so consumers can use.
		 * We know all pages will be under Jetpack top level menu page, so we can hardcode the first part of the string.
		 * Using get_plugin_page_hookname here won't work because the top level page is not registered yet.
		 */
		return 'jetpack_page_' . $menu_slug;
	}

	/**
	 * Gets registered menu items with normalized metadata.
	 *
	 * @return array
	 */
	public static function get_registered_menu_items() {
		return array_values( self::$menu_items );
	}

	/**
	 * Returns whether the menu customization feature is available.
	 *
	 * @return bool
	 */
	public static function is_customization_feature_enabled() {
		return (bool) apply_filters( self::CUSTOMIZATION_FEATURE_FILTER, false );
	}

	/**
	 * Returns whether the customized menu layout is active for this request.
	 *
	 * @return bool
	 */
	public static function is_customization_active() {
		if ( ! self::is_customization_feature_enabled() ) {
			return false;
		}

		$layout = self::get_site_menu_layout();
		$active = ! empty( $layout['enabled'] );

		return (bool) apply_filters( self::CUSTOMIZATION_ACTIVE_FILTER, $active, $layout );
	}

	/**
	 * Gets the site-level admin menu layout.
	 *
	 * @return array
	 */
	public static function get_site_menu_layout() {
		$layout = get_option( self::CUSTOMIZATION_SITE_OPTION, array() );
		if ( ! is_array( $layout ) ) {
			$layout = array();
		}
		$sanitized_layout = self::sanitize_menu_layout( $layout );
		if ( ! array_key_exists( 'enabled', $layout ) ) {
			unset( $sanitized_layout['enabled'] );
		}

		return self::merge_menu_layouts( self::get_default_site_menu_layout(), $sanitized_layout );
	}

	/**
	 * Updates the site-level admin menu layout.
	 *
	 * @param array $layout Layout data.
	 * @return bool
	 */
	public static function update_site_menu_layout( $layout ) {
		return update_option( self::CUSTOMIZATION_SITE_OPTION, self::sanitize_menu_layout( $layout ) );
	}

	/**
	 * Gets personal admin menu preferences.
	 *
	 * @param int $user_id User ID. Defaults to the current user.
	 * @return array
	 */
	public static function get_user_menu_layout( $user_id = 0 ) {
		$user_id = $user_id ? (int) $user_id : get_current_user_id();
		if ( ! $user_id ) {
			return self::get_default_user_menu_layout();
		}

		$layout = get_user_meta( $user_id, self::CUSTOMIZATION_USER_META, true );
		if ( ! is_array( $layout ) ) {
			$layout = array();
		}
		$sanitized_layout = self::sanitize_menu_layout( $layout );
		if ( ! array_key_exists( 'enabled', $layout ) ) {
			unset( $sanitized_layout['enabled'] );
		}

		return self::merge_menu_layouts( self::get_default_user_menu_layout(), $sanitized_layout );
	}

	/**
	 * Updates personal admin menu preferences.
	 *
	 * @param array $layout  Layout data.
	 * @param int   $user_id User ID. Defaults to the current user.
	 * @return int|bool
	 */
	public static function update_user_menu_layout( $layout, $user_id = 0 ) {
		$user_id = $user_id ? (int) $user_id : get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		return update_user_meta( $user_id, self::CUSTOMIZATION_USER_META, self::sanitize_menu_layout( $layout ) );
	}

	/**
	 * Deletes the site-level admin menu layout.
	 *
	 * @return bool
	 */
	public static function reset_site_menu_layout() {
		return delete_option( self::CUSTOMIZATION_SITE_OPTION );
	}

	/**
	 * Deletes personal admin menu preferences.
	 *
	 * @param int $user_id User ID. Defaults to the current user.
	 * @return bool
	 */
	public static function reset_user_menu_layout( $user_id = 0 ) {
		$user_id = $user_id ? (int) $user_id : get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		return delete_user_meta( $user_id, self::CUSTOMIZATION_USER_META );
	}

	/**
	 * Gets the customization model for UI consumers.
	 *
	 * @param int $user_id User ID. Defaults to the current user.
	 * @return array
	 */
	public static function get_customization_model( $user_id = 0 ) {
		$site_layout = self::get_site_menu_layout();
		$user_layout = self::get_user_menu_layout( $user_id );
		$items       = self::get_registered_menu_items();

		if ( empty( $items ) ) {
			$items = self::get_recommended_menu_catalog_items();
		}

		return array(
			'featureEnabled' => self::is_customization_feature_enabled(),
			'active'         => self::is_customization_active(),
			'siteLayout'     => $site_layout,
			'userLayout'     => $user_layout,
			'groups'         => array_values( $site_layout['groups'] ),
			'items'          => self::get_customization_model_items( $items, $site_layout, $user_layout ),
		);
	}

	/**
	 * Sanitizes persisted menu layout data.
	 *
	 * @param array $layout Raw layout data.
	 * @return array
	 */
	public static function sanitize_menu_layout( $layout ) {
		$sanitized = array(
			'enabled' => false,
			'groups'  => array(),
			'items'   => array(),
		);

		if ( ! is_array( $layout ) ) {
			return $sanitized;
		}

		if ( array_key_exists( 'enabled', $layout ) ) {
			$sanitized['enabled'] = (bool) $layout['enabled'];
		}

		if ( ! empty( $layout['groups'] ) && is_array( $layout['groups'] ) ) {
			foreach ( $layout['groups'] as $group_id => $group ) {
				if ( ! is_array( $group ) ) {
					continue;
				}

				$group_id = sanitize_key( $group_id );
				if ( empty( $group_id ) ) {
					continue;
				}

				$sanitized['groups'][ $group_id ] = array(
					'id'    => $group_id,
					'label' => isset( $group['label'] ) ? sanitize_text_field( $group['label'] ) : '',
					'order' => isset( $group['order'] ) && is_numeric( $group['order'] ) ? (int) $group['order'] : 100,
				);
			}
		}

		if ( ! empty( $layout['items'] ) && is_array( $layout['items'] ) ) {
			foreach ( $layout['items'] as $item_id => $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}

				$item_id = sanitize_key( $item_id );
				if ( empty( $item_id ) ) {
					continue;
				}

				$sanitized['items'][ $item_id ] = array();

				if ( array_key_exists( 'hidden', $item ) ) {
					$sanitized['items'][ $item_id ]['hidden'] = (bool) $item['hidden'];
				}

				if ( isset( $item['group'] ) ) {
					$sanitized['items'][ $item_id ]['group'] = sanitize_key( $item['group'] );
				}

				if ( isset( $item['order'] ) && is_numeric( $item['order'] ) ) {
					$sanitized['items'][ $item_id ]['order'] = (int) $item['order'];
				}
			}
		}

		return $sanitized;
	}

	/**
	 * Gets menu items in the order they should be registered.
	 *
	 * @return array
	 */
	private static function get_menu_items_for_registration() {
		$menu_items = self::$menu_items;

		if ( self::is_customization_active() ) {
			return self::resolve_customized_menu_items( $menu_items );
		}

		self::sort_legacy_menu_items( $menu_items );
		self::$menu_items = $menu_items;

		return $menu_items;
	}

	/**
	 * Sorts menu items with the legacy position/title behavior.
	 *
	 * @param array $menu_items Menu items.
	 * @return void
	 */
	private static function sort_legacy_menu_items( &$menu_items ) {
		usort(
			$menu_items,
			function ( $a, $b ) {
				$result = self::compare_settings_menu_item_position( $a, $b );
				if ( 0 !== $result ) {
					return $result;
				}

				$position_a = empty( $a['position'] ) ? 0 : $a['position'];
				$position_b = empty( $b['position'] ) ? 0 : $b['position'];
				$result     = $position_a <=> $position_b;

				if ( 0 === $result ) {
					$result = strcmp( $a['menu_title'], $b['menu_title'] );
				}

				return $result;
			}
		);

		self::append_settings_menu_item( $menu_items );
	}

	/**
	 * Resolves menu items against the saved site and user layouts.
	 *
	 * @param array $menu_items Menu items.
	 * @return array
	 */
	private static function resolve_customized_menu_items( $menu_items ) {
		$site_layout    = self::get_site_menu_layout();
		$user_layout    = self::get_user_menu_layout();
		$resolved_items = array();

		foreach ( $menu_items as $menu_item ) {
			if ( ! current_user_can( $menu_item['capability'] ) ) {
				continue;
			}

			$metadata  = $menu_item['metadata'];
			$item_id   = $metadata['id'];
			$item_prefs = self::get_resolved_item_preferences( $item_id, $metadata, $site_layout, $user_layout );

			if ( ! empty( $item_prefs['hidden'] ) && ! empty( $metadata['customizable'] ) ) {
				continue;
			}

			$group_id    = $item_prefs['group'];
			$group       = self::get_group_for_layout( $group_id, $site_layout );
			$menu_item['metadata']['group']       = $group_id;
			$menu_item['metadata']['group_label'] = $group['label'];
			$menu_item['metadata']['order']       = $item_prefs['order'];
			$menu_item['resolved_group_order']    = $group['order'];
			$menu_item['resolved_order']          = $item_prefs['order'];
			$resolved_items[]                     = $menu_item;
		}

		usort(
			$resolved_items,
			function ( $a, $b ) {
				$result = self::compare_settings_menu_item_position( $a, $b );
				if ( 0 !== $result ) {
					return $result;
				}

				$result = $a['resolved_group_order'] <=> $b['resolved_group_order'];
				if ( 0 === $result ) {
					$result = $a['resolved_order'] <=> $b['resolved_order'];
				}
				if ( 0 === $result ) {
					$result = strcmp( $a['menu_title'], $b['menu_title'] );
				}

				return $result;
			}
		);

		$seen_groups = array();
		foreach ( $resolved_items as $index => $menu_item ) {
			$group_id    = $menu_item['metadata']['group'];
			$group_label = $menu_item['metadata']['group_label'];
			$classes     = array( 'jetpack-admin-menu-item' );

			if ( ! isset( $seen_groups[ $group_id ] ) ) {
				$seen_groups[ $group_id ] = true;
				if ( ! empty( $group_label ) ) {
					$classes[]                          = 'jetpack-admin-menu-group-start';
					$classes[]                          = 'jetpack-admin-menu-group-' . sanitize_html_class( $group_id );
					$resolved_items[ $index ]['menu_title'] = self::add_group_label_to_menu_title( $menu_item['menu_title'], $group_label );
				}
			}

			$resolved_items[ $index ]['classes']  = $classes;
			$resolved_items[ $index ]['position'] = $index + 1;
		}

		return $resolved_items;
	}

	/**
	 * Gets item preferences after applying defaults, site layout, and user layout.
	 *
	 * @param string $item_id     Item ID.
	 * @param array  $metadata    Normalized metadata.
	 * @param array  $site_layout Site layout.
	 * @param array  $user_layout User layout.
	 * @return array
	 */
	private static function get_resolved_item_preferences( $item_id, $metadata, $site_layout, $user_layout ) {
		$prefs = array(
			'hidden' => false,
			'group'  => $metadata['group'],
			'order'  => $metadata['order'],
		);

		if ( isset( $site_layout['items'][ $item_id ] ) ) {
			$prefs = array_merge( $prefs, $site_layout['items'][ $item_id ] );
		}

		if ( isset( $user_layout['items'][ $item_id ] ) ) {
			$prefs = array_merge( $prefs, $user_layout['items'][ $item_id ] );
		}

		$prefs['group'] = ! empty( $prefs['group'] ) ? sanitize_key( $prefs['group'] ) : $metadata['group'];
		$prefs['order'] = isset( $prefs['order'] ) && is_numeric( $prefs['order'] ) ? (int) $prefs['order'] : $metadata['order'];

		return $prefs;
	}

	/**
	 * Gets a group definition for a layout.
	 *
	 * @param string $group_id    Group ID.
	 * @param array  $site_layout Site layout.
	 * @return array
	 */
	private static function get_group_for_layout( $group_id, $site_layout ) {
		if ( isset( $site_layout['groups'][ $group_id ] ) ) {
			return $site_layout['groups'][ $group_id ];
		}

		$groups = self::get_recommended_groups();
		if ( isset( $groups[ $group_id ] ) ) {
			return $groups[ $group_id ];
		}

		return array(
			'id'    => $group_id,
			'label' => '',
			'order' => 500,
		);
	}

	/**
	 * Adds a non-interactive group label inside the normal submenu title.
	 *
	 * @param string $menu_title  Menu title.
	 * @param string $group_label Group label.
	 * @return string
	 */
	private static function add_group_label_to_menu_title( $menu_title, $group_label ) {
		return '<span class="jetpack-admin-menu-group-label" aria-hidden="true">' . esc_html( $group_label ) . '</span><span class="jetpack-admin-menu-item-label">' . wp_kses_post( $menu_title ) . '</span>';
	}

	/**
	 * Adds CSS classes to a registered submenu item.
	 *
	 * @param string $menu_slug Menu slug.
	 * @param array  $classes   Classes to add.
	 * @return void
	 */
	private static function add_submenu_item_classes( $menu_slug, $classes ) {
		global $submenu;

		if ( empty( $submenu['jetpack'] ) ) {
			return;
		}

		foreach ( $submenu['jetpack'] as $index => $item ) {
			if ( isset( $item[2] ) && $item[2] === $menu_slug ) {
				$existing = ! empty( $item[4] ) ? $item[4] . ' ' : '';
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu['jetpack'][ $index ][4] = trim( $existing . implode( ' ', array_map( 'sanitize_html_class', $classes ) ) );
				break;
			}
		}
	}

	/**
	 * Normalizes menu customization metadata.
	 *
	 * @param array $menu_item Menu item.
	 * @param array $metadata  Raw metadata.
	 * @return array
	 */
	private static function normalize_menu_metadata( $menu_item, $metadata = array() ) {
		if ( ! is_array( $metadata ) ) {
			$metadata = array();
		}

		$item_id              = ! empty( $metadata['id'] ) ? self::normalize_menu_item_id( $metadata['id'] ) : self::infer_menu_item_id( $menu_item );
		$recommended_defaults = self::get_recommended_menu_item_defaults();
		$defaults             = $recommended_defaults[ $item_id ] ?? array();
		$metadata             = array_merge( $defaults, $metadata );
		$group                = ! empty( $metadata['group'] ) ? sanitize_key( $metadata['group'] ) : 'manage';
		$groups               = self::get_recommended_groups();
		$group_label          = isset( $metadata['group_label'] ) ? sanitize_text_field( $metadata['group_label'] ) : ( $groups[ $group ]['label'] ?? '' );

		return array(
			'id'           => $item_id,
			'group'        => $group,
			'group_label'  => $group_label,
			'order'        => isset( $metadata['order'] ) && is_numeric( $metadata['order'] ) ? (int) $metadata['order'] : self::get_position_order( $menu_item ),
			'customizable' => array_key_exists( 'customizable', $metadata ) ? (bool) $metadata['customizable'] : true,
			'external'     => array_key_exists( 'external', $metadata ) ? (bool) $metadata['external'] : self::is_external_menu_slug( $menu_item['menu_slug'] ),
		);
	}

	/**
	 * Infers a stable item ID from the menu slug/title.
	 *
	 * @param array $menu_item Menu item.
	 * @return string
	 */
	private static function infer_menu_item_id( $menu_item ) {
		$slug     = (string) $menu_item['menu_slug'];
		$slug_map = array(
			'my-jetpack'                         => 'my-jetpack',
			'stats'                              => 'stats',
			'jetpack-forms-admin'                => 'forms',
			'jetpack-forms-responses-wp-admin'   => 'forms',
			'jetpack-newsletter'                 => 'newsletter',
			'jetpack-social'                     => 'social',
			'jetpack-ai'                         => 'ai',
			'jetpack-videopress'                 => 'videopress',
			'jetpack-backup'                     => 'backup',
			'jetpack-scan'                       => 'scan',
			'akismet-key-config'                 => 'akismet-anti-spam',
			'jetpack-activity-log'               => 'activity-log',
			'jetpack-search'                     => 'search',
		);

		if ( isset( $slug_map[ $slug ] ) ) {
			return $slug_map[ $slug ];
		}

		if ( false !== strpos( $slug, '#/settings' ) ) {
			return 'settings';
		}

		$normalized_title = self::normalize_menu_item_id( wp_strip_all_tags( $menu_item['menu_title'] ) );
		$title_map        = array(
			'akismet-anti-spam' => 'akismet-anti-spam',
			'jetpack-manage'   => 'jetpack-manage',
			'subscribers'      => 'subscribers',
			'vaultpress-backup' => 'backup',
		);

		if ( isset( $title_map[ $normalized_title ] ) ) {
			return $title_map[ $normalized_title ];
		}

		if ( self::is_external_menu_slug( $slug ) && ! empty( $normalized_title ) ) {
			return $normalized_title;
		}

		return self::normalize_menu_item_id( $slug );
	}

	/**
	 * Normalizes a menu item ID.
	 *
	 * @param string $value Raw value.
	 * @return string
	 */
	private static function normalize_menu_item_id( $value ) {
		$value = strtolower( wp_strip_all_tags( (string) $value ) );
		$value = preg_replace( '/[^a-z0-9_-]+/', '-', $value );
		$value = trim( $value, '-' );

		return sanitize_key( $value );
	}

	/**
	 * Determines whether a menu slug points away from local wp-admin.
	 *
	 * @param string $menu_slug Menu slug.
	 * @return bool
	 */
	private static function is_external_menu_slug( $menu_slug ) {
		return 1 === preg_match( '#^https?://#i', (string) $menu_slug );
	}

	/**
	 * Compares whether Settings should be pinned after another menu item.
	 *
	 * @param array $a First menu item.
	 * @param array $b Second menu item.
	 * @return int
	 */
	private static function compare_settings_menu_item_position( $a, $b ) {
		$a_is_settings = self::is_settings_menu_item( $a );
		$b_is_settings = self::is_settings_menu_item( $b );

		if ( $a_is_settings === $b_is_settings ) {
			return 0;
		}

		return $a_is_settings ? 1 : -1;
	}

	/**
	 * Determines whether a menu item is the Settings item.
	 *
	 * @param array $menu_item Menu item.
	 * @return bool
	 */
	private static function is_settings_menu_item( $menu_item ) {
		$item_id = '';

		if ( isset( $menu_item['metadata']['id'] ) ) {
			$item_id = $menu_item['metadata']['id'];
		} elseif ( isset( $menu_item['id'] ) ) {
			$item_id = $menu_item['id'];
		}

		return 'settings' === $item_id;
	}

	/**
	 * Ensures Settings appends after other normal submenu items in legacy registration.
	 *
	 * @param array $menu_items Menu items.
	 * @return void
	 */
	private static function append_settings_menu_item( &$menu_items ) {
		foreach ( $menu_items as $index => $menu_item ) {
			if ( self::is_settings_menu_item( $menu_item ) ) {
				$menu_items[ $index ]['position'] = null;
			}
		}
	}

	/**
	 * Gets an integer ordering fallback from position.
	 *
	 * @param array $menu_item Menu item.
	 * @return int
	 */
	private static function get_position_order( $menu_item ) {
		return isset( $menu_item['position'] ) && is_numeric( $menu_item['position'] ) ? (int) $menu_item['position'] : 100;
	}

	/**
	 * Gets recommended metadata for known Jetpack menu items.
	 *
	 * @return array
	 */
	private static function get_recommended_menu_item_defaults() {
		return array(
			'my-jetpack'         => array(
				'group'        => 'top',
				'order'        => 0,
				'customizable' => false,
			),
			'stats'              => array(
				'group' => 'top',
				'order' => 10,
			),
			'forms'              => array(
				'group' => 'create',
				'order' => 20,
			),
			'newsletter'         => array(
				'group' => 'create',
				'order' => 30,
			),
			'subscribers'        => array(
				'group'    => 'create',
				'order'    => 35,
				'external' => true,
			),
			'social'             => array(
				'group' => 'create',
				'order' => 40,
			),
			'ai'                 => array(
				'group' => 'create',
				'order' => 50,
			),
			'videopress'         => array(
				'group' => 'create',
				'order' => 55,
			),
			'backup'             => array(
				'group' => 'protect',
				'order' => 60,
			),
			'scan'               => array(
				'group' => 'protect',
				'order' => 70,
			),
			'akismet-anti-spam'  => array(
				'group' => 'protect',
				'order' => 80,
			),
			'activity-log'       => array(
				'group' => 'manage',
				'order' => 90,
			),
			'search'             => array(
				'group' => 'manage',
				'order' => 95,
			),
			'jetpack-manage'     => array(
				'group'    => 'manage',
				'order'    => 100,
				'external' => true,
			),
			'settings'           => array(
				'group'        => 'utility',
				'order'        => 900,
				'customizable' => false,
			),
		);
	}

	/**
	 * Gets recommended menu groups.
	 *
	 * @return array
	 */
	private static function get_recommended_groups() {
		return array(
			'top'     => array(
				'id'    => 'top',
				'label' => '',
				'order' => 0,
			),
			'create'  => array(
				'id'    => 'create',
				'label' => __( 'Create', 'jetpack-admin-ui' ),
				'order' => 20,
			),
			'protect' => array(
				'id'    => 'protect',
				'label' => __( 'Protect', 'jetpack-admin-ui' ),
				'order' => 30,
			),
			'manage'  => array(
				'id'    => 'manage',
				'label' => __( 'Manage', 'jetpack-admin-ui' ),
				'order' => 40,
			),
			'utility' => array(
				'id'    => 'utility',
				'label' => '',
				'order' => 90,
			),
		);
	}

	/**
	 * Gets the default site layout.
	 *
	 * @return array
	 */
	private static function get_default_site_menu_layout() {
		return array(
			'enabled' => (bool) apply_filters( self::CUSTOMIZATION_DEFAULT_ENABLED_FILTER, false ),
			'groups'  => self::get_recommended_groups(),
			'items'   => array(),
		);
	}

	/**
	 * Gets the default user layout.
	 *
	 * @return array
	 */
	private static function get_default_user_menu_layout() {
		return array(
			'enabled' => false,
			'groups'  => array(),
			'items'   => array(),
		);
	}

	/**
	 * Merges two menu layout arrays.
	 *
	 * @param array $base     Base layout.
	 * @param array $override Override layout.
	 * @return array
	 */
	private static function merge_menu_layouts( $base, $override ) {
		if ( array_key_exists( 'enabled', $override ) ) {
			$base['enabled'] = (bool) $override['enabled'];
		}

		if ( ! empty( $override['groups'] ) ) {
			foreach ( $override['groups'] as $group_id => $group ) {
				$base['groups'][ $group_id ] = array_merge( $base['groups'][ $group_id ] ?? array(), $group );
			}
		}

		if ( ! empty( $override['items'] ) ) {
			foreach ( $override['items'] as $item_id => $item ) {
				$base['items'][ $item_id ] = array_merge( $base['items'][ $item_id ] ?? array(), $item );
			}
		}

		return $base;
	}

	/**
	 * Gets customization items for the UI model.
	 *
	 * @param array $items       Registered or catalog menu items.
	 * @param array $site_layout Site layout.
	 * @param array $user_layout User layout.
	 * @return array
	 */
	private static function get_customization_model_items( $items, $site_layout, $user_layout ) {
		$model_items = array();

		foreach ( $items as $menu_item ) {
			$metadata   = $menu_item['metadata'];
			$item_id    = $metadata['id'];
			$item_prefs = self::get_resolved_item_preferences( $item_id, $metadata, $site_layout, $user_layout );
			$group      = self::get_group_for_layout( $item_prefs['group'], $site_layout );

			$model_items[] = array(
				'id'           => $item_id,
				'label'        => html_entity_decode( wp_strip_all_tags( $menu_item['menu_title'] ), ENT_QUOTES, get_bloginfo( 'charset' ) ),
				'menuSlug'     => $menu_item['menu_slug'],
				'group'        => $item_prefs['group'],
				'groupLabel'   => $group['label'],
				'order'        => $item_prefs['order'],
				'customizable' => (bool) $metadata['customizable'],
				'hidden'       => ! empty( $item_prefs['hidden'] ),
				'external'     => (bool) $metadata['external'],
			);
		}

		usort(
			$model_items,
			function ( $a, $b ) use ( $site_layout ) {
				$result = self::compare_settings_menu_item_position( $a, $b );
				if ( 0 !== $result ) {
					return $result;
				}

				$group_a = self::get_group_for_layout( $a['group'], $site_layout );
				$group_b = self::get_group_for_layout( $b['group'], $site_layout );
				$result  = $group_a['order'] <=> $group_b['order'];
				if ( 0 === $result ) {
					$result = $a['order'] <=> $b['order'];
				}
				if ( 0 === $result ) {
					$result = strcmp( $a['label'], $b['label'] );
				}

				return $result;
			}
		);

		return $model_items;
	}

	/**
	 * Gets a fallback catalog for REST requests where wp-admin menu hooks did not run.
	 *
	 * @return array
	 */
	private static function get_recommended_menu_catalog_items() {
		$labels = array(
			'my-jetpack'        => __( 'My Jetpack', 'jetpack-admin-ui' ),
			'stats'             => __( 'Stats', 'jetpack-admin-ui' ),
			'forms'             => __( 'Forms', 'jetpack-admin-ui' ),
			'newsletter'        => __( 'Newsletter', 'jetpack-admin-ui' ),
			'subscribers'       => __( 'Subscribers', 'jetpack-admin-ui' ),
			'social'            => __( 'Social', 'jetpack-admin-ui' ),
			'ai'                => __( 'AI', 'jetpack-admin-ui' ),
			'videopress'        => __( 'VideoPress', 'jetpack-admin-ui' ),
			'backup'            => __( 'Backup', 'jetpack-admin-ui' ),
			'scan'              => __( 'Scan', 'jetpack-admin-ui' ),
			'akismet-anti-spam' => __( 'Akismet Anti-spam', 'jetpack-admin-ui' ),
			'activity-log'      => __( 'Activity Log', 'jetpack-admin-ui' ),
			'search'            => __( 'Search', 'jetpack-admin-ui' ),
			'jetpack-manage'    => __( 'Jetpack Manage', 'jetpack-admin-ui' ),
			'settings'          => __( 'Settings', 'jetpack-admin-ui' ),
		);
		$items  = array();

		foreach ( $labels as $id => $label ) {
			$menu_item = array(
				'page_title' => $label,
				'menu_title' => $label,
				'capability' => 'manage_options',
				'menu_slug'  => $id,
				'function'   => null,
				'position'   => null,
			);

			if ( 'my-jetpack' === $id ) {
				$menu_item['capability'] = 'edit_posts';
			}

			$menu_item['metadata'] = self::normalize_menu_metadata( $menu_item, array( 'id' => $id ) );
			$items[]               = $menu_item;
		}

		return $items;
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
		if ( ! self::should_show_upgrade_menu() && ! self::is_customization_active() ) {
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

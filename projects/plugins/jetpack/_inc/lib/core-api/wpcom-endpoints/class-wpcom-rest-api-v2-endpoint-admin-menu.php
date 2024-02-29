<?php
/**
 * REST API endpoint for admin menus.
 *
 * @package automattic/jetpack
 * @since 9.1.0
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Admin_Menu
 */
class WPCOM_REST_API_V2_Endpoint_Admin_Menu extends WP_REST_Controller {

	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'admin-menu';

	/**
	 *
	 * Set of core dashicons.
	 *
	 * @var array
	 */
	private $dashicon_list;

	/**
	 * WPCOM_REST_API_V2_Endpoint_Admin_Menu constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to admin menus.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'read' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view menus on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves the admin menu.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		require_once JETPACK__PLUGIN_DIR . '/modules/masterbar/admin-menu/load.php';

		// All globals need to be declared for menu items to properly register.
		global $admin_page_hooks, $menu, $menu_order, $submenu, $_wp_menu_nopriv, $_wp_submenu_nopriv; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		$this->hide_customizer_menu_on_block_theme();
		require_once ABSPATH . 'wp-admin/includes/admin.php';
		require_once ABSPATH . 'wp-admin/menu.php';

		return rest_ensure_response( $this->prepare_menu_for_response( $menu ) );
	}

	/**
	 * Hides the Customizer menu items when the block theme is active by removing the dotcom-specific actions.
	 * They are not needed for block themes.
	 *
	 * @see https://github.com/Automattic/jetpack/pull/36017
	 */
	private function hide_customizer_menu_on_block_theme() {
		if ( wp_is_block_theme() ) {
			remove_action( 'customize_register', 'add_logotool_button', 20 );
			remove_action( 'customize_register', 'footercredits_register', 99 );
			remove_action( 'customize_register', 'wpcom_disable_customizer_site_icon', 20 );

			if ( class_exists( '\Jetpack_Fonts' ) ) {
				$jetpack_fonts_instance = \Jetpack_Fonts::get_instance();
				remove_action( 'customize_register', array( $jetpack_fonts_instance, 'register_controls' ) );
				remove_action( 'customize_register', array( $jetpack_fonts_instance, 'maybe_prepopulate_option' ), 0 );
			}

			remove_action( 'customize_register', array( 'Jetpack_Fonts_Typekit', 'maybe_override_for_advanced_mode' ), 20 );

			remove_action( 'customize_register', 'Automattic\Jetpack\Dashboard_Customizations\register_css_nudge_control' );

			remove_action( 'customize_register', array( 'Jetpack_Custom_CSS_Enhancements', 'customize_register' ) );
		}
	}

	/**
	 * Prepares the admin menu for the REST response.
	 *
	 * @param array $menu Admin menu.
	 * @return array Admin menu
	 */
	public function prepare_menu_for_response( array $menu ) {
		global $submenu;

		$data = array();

		/**
		 * Note: if the shape of the API endpoint data changes it is important to also update
		 * the corresponding schema.js file.
		 * See: https://github.com/Automattic/wp-calypso/blob/ebde236ec9b21ea9621c0b0523bd5ea185523731/client/state/admin-menu/schema.js
		 */
		foreach ( $menu as $menu_item ) {
			$item = $this->prepare_menu_item( $menu_item );

			// Are there submenu items to process?
			if ( ! empty( $submenu[ $menu_item[2] ] ) ) {
				$submenu_items = array_values( $submenu[ $menu_item[2] ] );

				// Add submenu items.
				foreach ( $submenu_items as $submenu_item ) {
					$submenu_item = $this->prepare_submenu_item( $submenu_item, $menu_item );
					if ( ! empty( $submenu_item ) ) {
						$item['children'][] = $submenu_item;
					}
				}
			}

			if ( ! empty( $item ) ) {
				$data[] = $item;
			}
		}

		return array_filter( $data );
	}

	/**
	 * Retrieves the admin menu's schema, conforming to JSON Schema.
	 *
	 * Note: if the shape of the API endpoint data changes it is important to also update
	 * the corresponding schema.js file.
	 *
	 * @see https://github.com/Automattic/wp-calypso/blob/ebde236ec9b21ea9621c0b0523bd5ea185523731/client/state/admin-menu/schema.js
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'Admin Menu',
			'type'       => 'object',
			'properties' => array(
				'count'      => array(
					'description' => 'Core/Plugin/Theme update count or unread comments count.',
					'type'        => 'integer',
				),
				'icon'       => array(
					'description' => 'Menu item icon. Dashicon slug or base64-encoded SVG.',
					'type'        => 'string',
				),
				'inlineText' => array(
					'description' => 'Additional text to be added inline with the menu title.',
					'type'        => 'string',
				),
				'badge'      => array(
					'description' => 'Badge to be added inline with the menu title.',
					'type'        => 'string',
				),
				'slug'       => array(
					'type' => 'string',
				),
				'children'   => array(
					'items' => array(
						'count'  => array(
							'description' => 'Core/Plugin/Theme update count or unread comments count.',
							'type'        => 'integer',
						),
						'parent' => array(
							'type' => 'string',
						),
						'slug'   => array(
							'type' => 'string',
						),
						'title'  => array(
							'type' => 'string',
						),
						'type'   => array(
							'enum' => array( 'submenu-item' ),
							'type' => 'string',
						),
						'url'    => array(
							'format' => 'uri',
							'type'   => 'string',
						),
					),
					'type'  => 'array',
				),
				'title'      => array(
					'type' => 'string',
				),
				'type'       => array(
					'enum' => array( 'separator', 'menu-item' ),
					'type' => 'string',
				),
				'url'        => array(
					'format' => 'uri',
					'type'   => 'string',
				),
			),
		);
	}

	/**
	 * Sets up a menu item for consumption by Calypso.
	 *
	 * @param array $menu_item Menu item.
	 * @return array Prepared menu item.
	 */
	private function prepare_menu_item( array $menu_item ) {
		global $submenu;

		$current_user_can_access_menu = current_user_can( $menu_item[1] );
		$submenu_items                = isset( $submenu[ $menu_item[2] ] ) ? array_values( $submenu[ $menu_item[2] ] ) : array();
		$has_first_menu_item          = isset( $submenu_items[0] );

		// Exclude unauthorized menu items when the user does not have access to the menu and the first submenu item.
		if ( ! $current_user_can_access_menu && $has_first_menu_item && ! current_user_can( $submenu_items[0][1] ) ) {
			return array();
		}

		// Exclude unauthorized menu items that don't have submenus.
		if ( ! $current_user_can_access_menu && ! $has_first_menu_item ) {
			return array();
		}

		// Exclude hidden menu items.
		if ( str_contains( $menu_item[4], 'hide-if-js' ) ) {
			// Exclude submenu items as well.
			if ( ! empty( $submenu[ $menu_item[2] ] ) ) {
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu[ $menu_item[2] ] = array();
			}
			return array();
		}

		// Handle menu separators.
		if ( str_contains( $menu_item[4], 'wp-menu-separator' ) ) {
			return array(
				'type' => 'separator',
			);
		}

		$url         = $menu_item[2];
		$parent_slug = '';

		// If there are submenus, the parent menu should always link to the first submenu.
		// @see https://core.trac.wordpress.org/browser/trunk/src/wp-admin/menu-header.php?rev=49193#L152.
		if ( ! empty( $submenu[ $menu_item[2] ] ) ) {
			$parent_slug        = $url;
			$first_submenu_item = reset( $submenu[ $menu_item[2] ] );
			$url                = $first_submenu_item[2];
		}

		$item = array(
			'icon'  => $this->prepare_menu_item_icon( $menu_item[6] ),
			'slug'  => sanitize_title_with_dashes( $menu_item[2] ),
			'title' => $menu_item[0],
			'type'  => 'menu-item',
			'url'   => $this->prepare_menu_item_url( $url, $parent_slug ),
		);

		$parsed_item = $this->parse_menu_item( $item['title'] );
		if ( ! empty( $parsed_item ) ) {
			$item = array_merge( $item, $parsed_item );
		}

		return $item;
	}

	/**
	 * Sets up a submenu item for consumption by Calypso.
	 *
	 * @param array $submenu_item Submenu item.
	 * @param array $menu_item    Menu item.
	 * @return array Prepared submenu item.
	 */
	private function prepare_submenu_item( array $submenu_item, array $menu_item ) {
		// Exclude unauthorized submenu items.
		if ( ! current_user_can( $submenu_item[1] ) ) {
			return array();
		}

		// Exclude hidden submenu items.
		if ( isset( $submenu_item[4] ) && str_contains( $submenu_item[4], 'hide-if-js' ) ) {
			return array();
		}

		$item = array(
			'parent' => sanitize_title_with_dashes( $menu_item[2] ),
			'slug'   => sanitize_title_with_dashes( $submenu_item[2] ),
			'title'  => $submenu_item[0],
			'type'   => 'submenu-item',
			'url'    => $this->prepare_menu_item_url( $submenu_item[2], $menu_item[2] ),
		);

		$parsed_item = $this->parse_menu_item( $item['title'] );
		if ( ! empty( $parsed_item ) ) {
			$item = array_merge( $item, $parsed_item );
		}

		return $item;
	}

	/**
	 * Prepares a menu icon for consumption by Calypso.
	 *
	 * @param string $icon Menu icon.
	 * @return string
	 */
	private function prepare_menu_item_icon( $icon ) {
		$img = 'dashicons-admin-generic';

		if ( ! empty( $icon ) && 'none' !== $icon && 'div' !== $icon ) {
			$img = esc_url( $icon );

			if ( str_starts_with( $icon, 'data:image/svg+xml' ) ) {
				$img = $icon;
			} elseif ( str_starts_with( $icon, 'dashicons-' ) ) {
				$img = $this->prepare_dashicon( $icon );
			}
		}

		return $img;
	}

	/**
	 * Prepares the dashicon for consumption by Calypso. If the dashicon isn't found in a list of known icons
	 * we will return the default dashicon.
	 *
	 * @param string $icon The dashicon string to check.
	 *
	 * @return string If the dashicon exists in core we return the dashicon, otherwise we return the default dashicon.
	 */
	private function prepare_dashicon( $icon ) {
		if ( empty( $this->dashicon_set ) ) {
			$this->dashicon_list = include JETPACK__PLUGIN_DIR . '/modules/masterbar/admin-menu/dashicon-set.php';
		}

		if ( isset( $this->dashicon_list[ $icon ] ) && $this->dashicon_list[ $icon ] ) {
			return $icon;
		}

		return 'dashicons-admin-generic';
	}

	/**
	 * Prepares a menu item url for consumption by Calypso.
	 *
	 * @param string $url         Menu slug.
	 * @param string $parent_slug Optional. Parent menu item slug. Default empty string.
	 * @return string
	 */
	private function prepare_menu_item_url( $url, $parent_slug = '' ) {
		// External URLS.
		if ( preg_match( '/^https?:\/\//', $url ) ) {
			// Allow URLs pointing to WordPress.com.
			if ( str_starts_with( $url, 'https://wordpress.com/' ) ) {
				// Calypso needs the domain removed so they're not interpreted as external links.
				$url = str_replace( 'https://wordpress.com', '', $url );
				// Replace special characters with their correct entities e.g. &amp; to &.
				return wp_specialchars_decode( esc_url_raw( $url ) );
			}

			// Allow URLs pointing to Jetpack.com.
			if ( str_starts_with( $url, 'https://jetpack.com/' ) ) {
				// Replace special characters with their correct entities e.g. &amp; to &.
				return wp_specialchars_decode( esc_url_raw( $url ) );
			}

			// Disallow other external URLs.
			if ( ! str_starts_with( $url, get_site_url() ) ) {
				return '';
			}
			// The URL matches that of the site, treat it as an internal URL.
		}

		// Internal URLs.
		$menu_hook   = get_plugin_page_hook( $url, $parent_slug );
		$menu_file   = wp_parse_url( $url, PHP_URL_PATH ); // Removes query args to get a file name.
		$parent_file = wp_parse_url( $parent_slug, PHP_URL_PATH );

		if (
			! empty( $menu_hook ) ||
			(
				'index.php' !== $url &&
				file_exists( WP_PLUGIN_DIR . "/$menu_file" ) &&
				! file_exists( ABSPATH . "/wp-admin/$menu_file" )
			)
		) {
			$admin_is_parent = false;
			if ( ! empty( $parent_slug ) ) {
				$menu_hook       = get_plugin_page_hook( $parent_slug, 'admin.php' );
				$admin_is_parent = ! empty( $menu_hook ) || ( ( 'index.php' !== $parent_slug ) && file_exists( WP_PLUGIN_DIR . "/$parent_file" ) && ! file_exists( ABSPATH . "/wp-admin/$parent_file" ) );
			}

			if (
				( false === $admin_is_parent && file_exists( WP_PLUGIN_DIR . "/$parent_file" ) && ! is_dir( WP_PLUGIN_DIR . "/$parent_file" ) ) ||
				( file_exists( ABSPATH . "/wp-admin/$parent_file" ) && ! is_dir( ABSPATH . "/wp-admin/$parent_file" ) )
			) {
				$url = add_query_arg( array( 'page' => $url ), admin_url( $parent_slug ) );
			} else {
				$url = add_query_arg( array( 'page' => $url ), admin_url( 'admin.php' ) );
			}
		} elseif ( file_exists( ABSPATH . "/wp-admin/$menu_file" ) ) {
			$url = admin_url( $url );
		}

		return wp_specialchars_decode( esc_url_raw( $url ) );
	}

	/**
	 * "Plugins", "Comments", "Updates" menu items have a count badge when there are updates available.
	 * This method parses that information, removes the associated markup and adds it to the response.
	 *
	 * Also sanitizes the titles from remaining unexpected markup.
	 *
	 * @param string $title Title to parse.
	 * @return array
	 */
	private function parse_menu_item( $title ) {
		$item = array();

		if (
			str_contains( $title, 'count-' )
			&& preg_match( '/<span class=".+\s?count-(\d*).+\s?<\/span><\/span>/', $title, $matches )
		) {

			$count = (int) ( $matches[1] );
			if ( $count > 0 ) {
				// Keep the counter in the item array.
				$item['count'] = $count;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		if (
			str_contains( $title, 'inline-text' )
			&& preg_match( '/<span class="inline-text".+\s?>(.+)<\/span>/', $title, $matches )
		) {

			$text = $matches[1];
			if ( $text ) {
				// Keep the text in the item array.
				$item['inlineText'] = $text;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		if (
			str_contains( $title, 'awaiting-mod' )
			&& preg_match( '/<span class="awaiting-mod">(.+)<\/span>/', $title, $matches )
		) {

			$text = $matches[1];
			if ( $text ) {
				// Keep the text in the item array.
				$item['badge'] = $text;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		// It's important we sanitize the title after parsing data to remove any unexpected markup but keep the content.
		// We are also capitalizing the first letter in case there was a counter (now parsed) in front of the title.
		$item['title'] = ucfirst( wp_strip_all_tags( $title ) );

		return $item;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

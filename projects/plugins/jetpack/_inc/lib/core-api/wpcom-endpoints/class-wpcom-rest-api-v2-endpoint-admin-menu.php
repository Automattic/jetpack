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
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			require_once WP_CONTENT_DIR . '/mu-plugins/masterbar/admin-menu/load.php';
		} else {
			require_once JETPACK__PLUGIN_DIR . '/modules/masterbar/admin-menu/load.php';
		}

		// All globals need to be declared for menu items to properly register.
		global $admin_page_hooks, $menu, $menu_order, $submenu, $_wp_menu_nopriv, $_wp_submenu_nopriv; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		require_once ABSPATH . 'wp-admin/includes/admin.php';
		require_once ABSPATH . 'wp-admin/menu.php';
		return rest_ensure_response( $this->prepare_menu_for_response( $menu ) );
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

				// If the user doesn't have the caps for the top level menu item, let's promote the first submenu item.
				if ( empty( $item ) ) {
					$menu_item[1] = $submenu_items[0][1]; // Capability.
					$menu_item[2] = $submenu_items[0][2]; // Menu slug.
					$item         = $this->prepare_menu_item( $menu_item );
				}

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
				'slug'       => array(
					'type' => 'string',
				),
				'children'   => array(
					'items' => array(
						'count'      => array(
							'description' => 'Core/Plugin/Theme update count or unread comments count.',
							'type'        => 'integer',
						),
						'parent'     => array(
							'type' => 'string',
						),
						'slug'       => array(
							'type' => 'string',
						),
						'title'      => array(
							'type' => 'string',
						),
						'type'       => array(
							'enum' => array( 'submenu-item' ),
							'type' => 'string',
						),
						'url'        => array(
							'format' => 'uri',
							'type'   => 'string',
						),
						'identifier' => array(
							'type' => 'string',
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
				'identifier' => array(
					'type' => 'string',
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

		// Exclude unauthorized menu items.
		if ( ! current_user_can( $menu_item[1] ) ) {
			return array();
		}

		// Exclude hidden menu items.
		if ( false !== strpos( $menu_item[4], 'hide-if-js' ) ) {
			// Exclude submenu items as well.
			if ( ! empty( $submenu[ $menu_item[2] ] ) ) {
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
				$submenu[ $menu_item[2] ] = array();
			}
			return array();
		}

		// Handle menu separators.
		if ( false !== strpos( $menu_item[4], 'wp-menu-separator' ) ) {
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

		$menu_identifier = $menu_item[5];

		$item = array(
			'icon'       => $this->prepare_menu_item_icon( $menu_item[6] ),
			'slug'       => sanitize_title_with_dashes( $menu_item[2] ),
			'title'      => $menu_item[0],
			'type'       => 'menu-item',
			'url'        => $this->prepare_menu_item_url( $url, $parent_slug ),
			'identifier' => $this->prepare_menu_item_identifier( $menu_identifier ),
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
		if ( isset( $submenu_item[4] ) && false !== strpos( $submenu_item[4], 'hide-if-js' ) ) {
			return array();
		}

		$slug = $submenu_item[2];

		$item = array(
			'parent'     => sanitize_title_with_dashes( $menu_item[2] ),
			'slug'       => sanitize_title_with_dashes( $slug ),
			'title'      => $submenu_item[0],
			'type'       => 'submenu-item',
			'url'        => $this->prepare_menu_item_url( $slug, $menu_item[2] ),
			// submenus don't have an identifier, we'll use the slug.
			'identifier' => $this->prepare_menu_item_identifier( $slug ),
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

			if ( 0 === strpos( $icon, 'data:image/svg+xml' ) ) {
				$img = $icon;
			} elseif ( 0 === strpos( $icon, 'dashicons-' ) ) {
				$img = sanitize_html_class( $icon );
			}
		}

		return $img;
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
			if ( 0 === strpos( $url, 'https://wordpress.com/' ) ) {
				// Calypso needs the domain removed so they're not interpreted as external links.
				$url = str_replace( 'https://wordpress.com', '', $url );
				return esc_url_raw( $url );
			}

			// Allow URLs pointing to Jetpack.com.
			if ( 0 === strpos( $url, 'https://jetpack.com/' ) ) {
				return esc_url_raw( $url );
			}

			// Disallow other external URLs.
			return '';
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
			if (
				( 'admin.php' !== $parent_file && file_exists( WP_PLUGIN_DIR . "/$parent_file" ) && ! is_dir( WP_PLUGIN_DIR . "/$parent_file" ) ) ||
				( file_exists( ABSPATH . "/wp-admin/$parent_file" ) && ! is_dir( ABSPATH . "/wp-admin/$parent_file" ) )
			) {
				$url = add_query_arg( array( 'page' => $url ), admin_url( $parent_slug ) );
			} else {
				$url = add_query_arg( array( 'page' => $url ), admin_url( 'admin.php' ) );
			}
		} elseif ( file_exists( ABSPATH . "/wp-admin/$menu_file" ) ) {
			$url = admin_url( $url );
		}

		return esc_url_raw( $url );
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

		if ( false !== strpos( $title, 'count-' ) ) {
			preg_match( '/<span class=".+\s?count-(\d*).+\s?<\/span><\/span>/', $title, $matches );

			$count = absint( $matches[1] );
			if ( $count > 0 ) {
				// Keep the counter in the item array.
				$item['count'] = $count;
			}

			// Finally remove the markup.
			$title = trim( str_replace( $matches[0], '', $title ) );
		}

		// It's important we sanitize the title after parsing data to remove any unexpected markup but keep the content.
		// We are also capilizing the first letter in case there was a counter (now parsed) in front of the title.
		$item['title'] = ucfirst( wp_strip_all_tags( $title ) );

		return $item;
	}

	/**
	 * Check if the given string is structured like a domain
	 *
	 * @TODO: Support deep nested domains like jp.eu.foo.something.something.wordpress.com
	 * @param string $domain_name_value The string that will be checked.
	 *
	 * @return false|int
	 */
	private function is_valid_domain_name( $domain_name_value = '' ) {
		return preg_match( '/^(http[s]?\:\/\/)?((\w+)\.)?(([\w-]+)?)(\.[\w-]+){1,2}$/', $domain_name_value );
	}

	/**
	 * Generate a identifier based on menu or submenu slug
	 *
	 * @param string $key Menu or submenu slug.
	 *
	 * @return string
	 */
	private function generate_identifier( $key ) {
		$replace_table = array(
			'http://'        => '',
			'https://'       => '',
			'.php'           => '', // we add this in order to avoid cases where customizer.php can be considered a domain.
			'toplevel_page_' => '',
		);

		// Replace strings with the ones from the $replace_table.
		$path_with_table_strings = strtr( $key, $replace_table );

		// Split string on '/' or '?' to account for query strings.
		$array_of_paths = preg_split( '/(\/|\?)/', $path_with_table_strings, -1, PREG_SPLIT_NO_EMPTY );

		// Dont touch domain names as these get filtered out next and replace non-alphanumeric characters with an underscore.
		$parsed_query_strings = $this->format_non_domain_identifiers( $array_of_paths );

		$array_without_domains = array_filter(
			$parsed_query_strings,
			function ( $value ) {
				return ! $this->is_valid_domain_name( $value );
			}
		);

		return sanitize_key( implode( '_', $array_without_domains ) );
	}

	/**
	 * Format non-domain identifiers
	 *
	 * It replaces non alphanumeric characters with underscores in paths that don't follow a domain-like structure.
	 *
	 * e.g. Given an array like ['test-test, 'example-domain.com'] will become ['test_test', 'example-domain.com']
	 *
	 * @param array $paths An array of slug parts.
	 *
	 * @return array|null[]|string[]|string[][]
	 */
	private function format_non_domain_identifiers( $paths ) {
		return array_map(
			function ( $value ) {
				if ( $this->is_valid_domain_name( $value ) ) {
					return $value;
				}

				return preg_replace( '/[^a-z0-9]+/', '_', strtolower( urldecode( $value ) ) );
			},
			$paths
		);
	}

	/**
	 * Map known custom identifiers to the newer version
	 *
	 * @return string[]
	 */
	private function get_known_identifiers() {
		return array(
			'menu_dashboard' => 'customer_home',
			'plans'          => 'plan',
		);
	}

	/**
	 * Transform menu item identifier based on the get_known_identifier list
	 *
	 * @param string $key The string value that will be replaced if it's in the known identifier list.
	 * @return string
	 */
	public function prepare_menu_item_identifier( $key ) {
		$known_identifiers = $this->get_known_identifiers();
		$identifier        = $this->generate_identifier( $key );

		if ( array_key_exists( $identifier, $known_identifiers ) ) {
			return $known_identifiers[ $identifier ];
		}

		return $identifier;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

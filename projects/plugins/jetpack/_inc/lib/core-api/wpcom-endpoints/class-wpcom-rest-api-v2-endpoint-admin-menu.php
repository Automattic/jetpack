<?php
/**
 * REST API endpoint for admin menus.
 *
 * @package Jetpack
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
		// All globals need to be declared for menu items to properly register.
		global $admin_page_hooks, $menu, $submenu, $_wp_menu_nopriv, $_wp_submenu_nopriv; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		// Make an attempt to not have the menu order altered.
		add_filter( 'custom_menu_order', '__return_false', 99999 );

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
					$item['children'][] = $this->prepare_submenu_item( $submenu_item, $menu_item );
				}
			}

			$data[] = $item;
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
				'count'    => array(
					'description' => 'Core/Plugin/Theme update count or unread comments count.',
					'type'        => 'integer',
				),
				'icon'     => array(
					'description' => 'Menu item icon. Dashicon slug or base64-encoded SVG.',
					'type'        => 'string',
				),
				'slug'     => array(
					'type' => 'string',
				),
				'children' => array(
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
				'title'    => array(
					'type' => 'string',
				),
				'type'     => array(
					'enum' => array( 'separator', 'menu-item' ),
					'type' => 'string',
				),
				'url'      => array(
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
		if ( ! current_user_can( $menu_item[1] ) ) {
			return array();
		}

		if ( false !== strpos( $menu_item[4], 'wp-menu-separator' ) ) {
			return array(
				'type' => 'separator',
			);
		}

		$item = array(
			'icon'  => $this->prepare_menu_item_icon( $menu_item[6] ),
			'slug'  => sanitize_title_with_dashes( $menu_item[2] ),
			'title' => $menu_item[0],
			'type'  => 'menu-item',
			'url'   => $this->prepare_menu_item_url( $menu_item[2] ),
		);

		$update_count = $this->parse_update_count( $item['title'] );
		if ( ! empty( $update_count ) ) {
			$item = array_merge( $item, $update_count );
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
		$item = array();

		if ( current_user_can( $submenu_item[1] ) ) {
			$item = array(
				'parent' => sanitize_title_with_dashes( $menu_item[2] ),
				'slug'   => sanitize_title_with_dashes( $submenu_item[2] ),
				'title'  => $submenu_item[0],
				'type'   => 'submenu-item',
				'url'    => $this->prepare_menu_item_url( $submenu_item[2], $menu_item[2] ),
			);

			$update_count = $this->parse_update_count( $item['title'] );
			if ( ! empty( $update_count ) ) {
				$item = array_merge( $item, $update_count );
			}
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
		// Calypso URLs need the base removed so they're not interpreted as external links.
		if ( 0 === strpos( $url, 'https://wordpress.com' ) ) {
			$url = str_replace( 'https://wordpress.com', '', $url );
		} else {
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
		}

		return $url;
	}

	/**
	 * Parses the update count from a given menu item title and removes the associated markup.
	 *
	 * "Plugin" and "Updates" menu items have a count badge when there are updates available.
	 * This method parses that information and adds it to the response.
	 *
	 * @param string $title Title to parse.
	 * @return array
	 */
	private function parse_update_count( $title ) {
		$item = array();

		if ( false !== strpos( $title, 'count-' ) ) {
			preg_match( '/class="(.+\s)?count-(\d*)/', $title, $matches );

			$count = absint( $matches[2] );
			if ( $count > 0 ) {
				$item['count'] = $count;
			}

			// Remove count badge HTML from title.
			$item['title'] = trim( substr( $title, 0, strpos( $title, '<' ) ) );
		}

		return $item;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

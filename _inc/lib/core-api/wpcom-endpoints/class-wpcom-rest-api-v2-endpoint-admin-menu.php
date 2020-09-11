<?php
/**
 * REST API endpoint for the admin menu json.
 *
 * @package A8C
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Admin_Menu
 */
class WPCOM_REST_API_V2_Endpoint_Admin_Menu extends WP_REST_Controller {
	/**
	 * Whether this is a wpcom-specific endpoint.
	 *
	 * @var bool
	 */
	public $wpcom_is_wpcom_only_endpoint = true;

	/**
	 * Whether this is a site-specific endpoint.
	 *
	 * @var bool
	 */
	public $wpcom_is_site_specific_endpoint = true;

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
				'show_in_index'       => false,
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'get_item_permissions_check' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to get a specific item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {  // phpcs:ignore
		return current_user_can( 'read' );
	}

	/**
	 * Retrieves one item from the collection.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		// Both globals need to be declared for menu items to properly register.
		global $menu, $submenu; // phpcs:ignore

		require_once ABSPATH . 'wp-admin/menu.php';

		return rest_ensure_response( $this->prepare_item_for_response( $menu, $request ) );
	}

	/**
	 * Prepares the item for the REST response.
	 *
	 * @param array           $menu    Admin menu.
	 * @param WP_REST_Request $request Request object.
	 * @return array Admin menu
	 */
	public function prepare_item_for_response( $menu, $request ) { // phpcs:ignore
		global $submenu;

		$data = array();

		foreach ( $menu as $menu_item ) {
			$item = $this->prepare_menu_item( $menu_item );

			if ( ! empty( $submenu[ $menu_item[2] ] ) ) {
				$item['children'] = array_map(
					function ( $submenu_item ) use ( $menu_item ) {
						return $this->prepare_submenu_item( $submenu_item, $menu_item );
					},
					$submenu[ $menu_item[2] ]
				);
			}

			$data[] = $item;
		}

		return array_filter( $data );
	}

	/**
	 * Sets up a menu item for consumption by Calypso.
	 *
	 * @param array $menu_item Menu item.
	 * @return array Prepared menu item.
	 */
	private function prepare_menu_item( $menu_item ) {
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
			'title' => wptexturize( $menu_item[0] ),
			'type'  => 'menu-item',
			'url'   => $this->prepare_menu_item_url( $menu_item[2] ),
		);

		if ( false !== strpos( $menu_item[0], 'count-' ) ) {
			preg_match( '/class="(.+\s)?count-(\d*)/', $menu_item[0], $matches );
			$item['count'] = absint( $matches[2] );
			$item['title'] = wptexturize( trim( substr( $menu_item[0], 0, strpos( $menu_item[0], '<' ) ) ) );
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
	private function prepare_submenu_item( $submenu_item, $menu_item ) {
		$item = array();

		if ( current_user_can( $submenu_item[1] ) ) {
			$item = array(
				'parent' => $menu_item[2],
				'slug'   => sanitize_title_with_dashes( $submenu_item[2] ),
				'title'  => wptexturize( $submenu_item[0] ),
				'type'   => 'submenu-item',
				'url'    => $this->prepare_menu_item_url( $submenu_item[2], $menu_item[2] ),
			);
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
		$img = '';

		if ( ! empty( $icon ) ) {
			$img = '<img src="' . esc_attr( $icon ) . '" alt="" />';

			if ( 'none' === $icon || 'div' === $icon ) {
				$img = '';
			} elseif ( 0 === strpos( $icon, 'data:image/svg+xml,' ) ) {
				$img = $icon;
			} elseif ( 0 === strpos( $icon, 'dashicons-' ) ) {
				$img = sanitize_html_class( $icon );
			}
		}

		return $img;
	}

	/**
	 * Prepares a menu icon for consumption by Calypso.
	 *
	 * @param string $url         Menu slug.
	 * @param string $parent_slug Parent menu item slug.
	 * @return string
	 */
	private function prepare_menu_item_url( $url, $parent_slug = null ) {
		if ( 0 === strpos( $url, 'http' ) ) {
			$url = str_replace( 'https://wordpress.com', '', $url );
		} else {
			$menu_hook = get_plugin_page_hook( $url, 'admin.php' );
			$menu_file = wp_parse_url( $url, PHP_URL_PATH );

			if (
				! empty( $menu_hook ) ||
				(
					'index.php' !== $url &&
					file_exists( WP_PLUGIN_DIR . "/$menu_file" ) &&
					! file_exists( ABSPATH . "/wp-admin/$menu_file" )
				)
			) {
				if ( ( 'admin.php' !== $parent_slug && file_exists( WP_PLUGIN_DIR . "/$parent_slug" ) && ! is_dir( WP_PLUGIN_DIR . "/$parent_slug" ) ) || file_exists( ABSPATH . "/wp-admin/$parent_slug" ) ) {
					$url = add_query_arg( array( 'page' => $url ), admin_url( $parent_slug ) );
				} else {
					$url = add_query_arg( array( 'page' => $url ), admin_url( 'admin.php' ) );
				}
			} else {
				$url = admin_url( $url );
			}
		}

		return esc_url( $url );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Admin_Menu' );

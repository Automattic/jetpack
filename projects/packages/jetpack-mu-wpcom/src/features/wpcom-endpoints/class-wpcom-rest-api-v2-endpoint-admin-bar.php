<?php
/**
 * Admin Bar REST API endpoint.
 *
 * Returns the admin bar for the current site. It is used in the
 * WordPress.com dashboard to render the admin bar when a site is selected.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Exposes the current site's admin bar.
 */
class WPCOM_REST_API_V2_Endpoint_Admin_Bar extends WP_REST_Controller {

	/**
	 * Top-level admin bar node IDs that are considered safe to show.
	 *
	 * @var string[]
	 */
	const ALLOWED_TOP_LEVEL_NODES = array( 'wpcom-logo', 'site-name', 'new-content', 'comments', 'updates', 'my-account' );

	/**
	 * Class constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'admin-bar';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_data' ),
					'permission_callback' => array( $this, 'can_access' ),
				),
			)
		);
	}

	/**
	 * Permission callback for the REST route.
	 *
	 * @return boolean
	 */
	public function can_access() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Returns the admin bar registered for the current site, filtered to
	 * the allowed top-level nodes and their descendants.
	 *
	 * @return WP_REST_Response
	 */
	public function get_data() {
		global $wp_admin_bar;

		if ( ! class_exists( 'WP_Screen' ) ) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		}

		if ( ! function_exists( 'set_current_screen' ) ) {
			require_once ABSPATH . 'wp-admin/includes/screen.php';
		}

		// Simulate a wp-admin context.
		set_current_screen( 'dashboard' );

		add_filter( 'show_admin_bar', '__return_true', 999 );
		_wp_admin_bar_init();
		do_action_ref_array( 'admin_bar_menu', array( &$wp_admin_bar ) );

		$nodes          = $wp_admin_bar->get_nodes() ?? array();
		$filtered_nodes = $this->filter_nodes( $nodes, self::ALLOWED_TOP_LEVEL_NODES );

		return new WP_REST_Response( array( 'nodes' => array_values( $filtered_nodes ) ), 200 );
	}

	/**
	 * Filters admin bar nodes to only include allowed top-level items and
	 * their descendants.
	 *
	 * @param array $nodes       All admin bar nodes keyed by ID.
	 * @param array $allowed_ids Top-level node IDs to keep.
	 * @return array Filtered nodes.
	 */
	private function filter_nodes( array $nodes, array $allowed_ids ) {
		$allowed = array();

		foreach ( $allowed_ids as $id ) {
			if ( isset( $nodes[ $id ] ) ) {
				$allowed[ $id ] = $nodes[ $id ];
			}
		}

		foreach ( $nodes as $id => $node ) {
			if ( isset( $allowed[ $id ] ) ) {
				continue;
			}

			$current = $node;
			while ( ! empty( $current->parent ) && isset( $nodes[ $current->parent ] ) ) {
				if ( in_array( $current->parent, $allowed_ids, true ) ) {
					$allowed[ $id ] = $node;
					break;
				}
				$current = $nodes[ $current->parent ];
			}
		}

		return $allowed;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Admin_Bar' );

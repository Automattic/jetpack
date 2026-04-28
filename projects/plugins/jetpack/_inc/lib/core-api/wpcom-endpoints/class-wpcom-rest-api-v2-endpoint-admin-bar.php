<?php
/**
 * REST API endpoint for admin bar.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Admin_Bar
 */
class WPCOM_REST_API_V2_Endpoint_Admin_Bar extends WP_REST_Controller {

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
	public $rest_base = 'admin-bar';

	/**
	 * Top-level admin bar node IDs that are considered safe to show.
	 *
	 * @var string[]
	 */
	const ALLOWED_TOP_LEVEL_NODES = array( 'wp-logo', 'site-name', 'updates', 'comments', 'new-content', 'my-account' );

	/**
	 * WPCOM_REST_API_V2_Endpoint_Admin_Bar constructor.
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
			)
		);
	}

	/**
	 * Checks if a given request has access to the admin bar.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view the admin bar on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Retrieves the admin bar registered for the current site, filtered to
	 * the allowed top-level nodes and their descendants.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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

		ob_start();
		do_action_ref_array( 'admin_bar_menu', array( &$wp_admin_bar ) );
		ob_clean();

		$nodes          = $wp_admin_bar->get_nodes() ?? array();
		$filtered_nodes = $this->filter_nodes( $nodes, self::ALLOWED_TOP_LEVEL_NODES );

		return rest_ensure_response( array( 'nodes' => array_values( $filtered_nodes ) ) );
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

		foreach ( $nodes as $id => $node ) {
			if ( in_array( $id, $allowed_ids, true ) ) {
				$allowed[ $id ] = $node;
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

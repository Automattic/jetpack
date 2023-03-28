<?php
/**
 * Custom CSS REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Class Custom_CSS
 */
class Custom_CSS extends \WP_REST_Posts_Controller {

	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import;

	/**
	 * Whether the controller supports batching.
	 *
	 * @var array
	 */
	protected $allow_batch = array( 'v1' => true );

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'custom_css' );

		$this->rest_base = 'custom-css';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see WP_REST_Posts_Controller::register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			self::$rest_namespace,
			'/' . $this->rest_base,
			$this->get_route_options()
		);
	}

	/**
	 * Update the custom CSS post.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( ! function_exists( 'wp_update_custom_css_post' ) ) {
			require_once ABSPATH . 'wp-includes/theme.php';
		}

		$args = array(
			'stylesheet' => $request['title'],
		);

		$post = wp_update_custom_css_post( $request['content'], $args );

		if ( is_wp_error( $post ) ) {
			return $post;
		}

		$response = $this->prepare_item_for_response( $post, $request );
		$response = rest_ensure_response( $response );

		return $this->add_import_id_metadata( $request, $response );
	}
}

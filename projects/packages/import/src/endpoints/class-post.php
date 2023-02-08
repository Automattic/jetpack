<?php
/**
 * Posts REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

if ( ! function_exists( 'post_exists' ) ) {
	require_once ABSPATH . 'wp-admin/includes/post.php';
}

/**
 * Class Post
 */
class Post extends \WP_REST_Posts_Controller {

	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import;

	/**
	 * Constructor.
	 *
	 * @param string $post_type Post type.
	 */
	public function __construct( $post_type = 'post' ) {
		parent::__construct( $post_type );

		// @see add_post_meta
		$this->import_id_meta_type = $post_type;
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
	 * Creates a single post / page.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$post_exist = \post_exists(
			$request['title'],
			'',
			$request['date'],
			$this->post_type,
			$request['status']
		);

		if ( $post_exist ) {
			return new \WP_Error(
				'rest_post_exists',
				__( 'Cannot create existing post.', 'jetpack-import' ),
				array( 'status' => 400 )
			);
		}

		return parent::create_item( $request );
	}

	/**
	 * Update the post parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 * @return bool True if updated.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$posts = \get_posts( $this->get_import_db_query( $parent_import_id ) );

		if ( is_array( $posts ) && count( $posts ) === 1 ) {
			$parent_id = $posts[0];

			return (bool) \wp_update_post(
				array(
					'ID'          => $resource_id,
					'post_parent' => $parent_id,
				)
			);
		}

		return false;
	}
}

<?php
/**
 * Comments REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Class Comment
 */
class Comment extends \WP_REST_Comments_Controller {

	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		// @see add_comment_meta
		$this->import_id_meta_type = 'comment';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see WP_REST_Comments_Controller::register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			self::$rest_namespace,
			$this->rest_base,
			$this->get_route_options()
		);
	}

	/**
	 * Creates a comment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or error object on failure.
	 */
	public function create_item( $request ) {
		// Resolve comment post ID.
		if ( ! empty( $request['post'] ) ) {
			$posts = \get_posts( $this->get_import_db_query( $request['post'] ) );

			// Overwrite the comment parent post ID.
			$request['post'] = is_array( $posts ) && count( $posts ) ? $posts[0] : 0;
		}

		// Resolve comment parent ID.
		if ( ! empty( $request['parent'] ) ) {
			$comments = \get_comments( $this->get_import_db_query( $request['parent'] ) );

			// Overwrite the comment parent post ID.
			$request['parent'] = is_array( $comments ) && count( $comments ) ? $comments[0] : 0;
		}

		$response = parent::create_item( $request );

		return $this->add_import_id_metadata( $request, $response );
	}
}

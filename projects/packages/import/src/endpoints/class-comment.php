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
		$this->import_id_meta_type = $this->rest_base;
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
		$response = parent::create_item( $request );

		return $this->add_import_id_metadata( $request, $response );
	}

	/**
	 * Update the comment parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 * @return bool True if updated.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$comments = \get_comments( $this->get_import_db_query( $parent_import_id ) );

		if ( is_array( $comments ) && count( $comments ) === 1 ) {
			$parent_id = $comments[0];

			return (bool) \wp_update_comment(
				array(
					'comment_ID'     => $resource_id,
					'comment_parent' => $parent_id,
				)
			);
		}

		return false;
	}
}

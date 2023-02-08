<?php
/**
 * Posts REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

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
	 */
	public function __construct() {
		parent::__construct( 'post' );

		// @see add_post_meta
		$this->import_id_meta_type = 'post';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see WP_REST_Posts_Controller::register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			self::$rest_namespace,
			'/posts',
			$this->get_route_options()
		);
	}

	/**
	 * Update the post parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 * @return bool True if updated.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$posts = get_posts( $this->get_import_db_query( $parent_import_id ) );

		if ( is_array( $posts ) && count( $posts ) === 1 ) {
			$parent_id = $posts[0];

			return (bool) wp_update_post(
				array(
					'ID'          => $resource_id,
					'post_parent' => $parent_id,
				)
			);
		}

		return false;
	}
}

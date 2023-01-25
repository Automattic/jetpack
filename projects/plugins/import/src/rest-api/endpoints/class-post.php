<?php
/**
 * Posts REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack_Import\REST_API\Endpoints;

/**
 * Class Post
 */
class Post extends \WP_REST_Posts_Controller {
	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import_ID;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'post' );

		// @see add_post_meta
		$this->import_id_meta_name = 'post';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see WP_REST_Posts_Controller::register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			JETPACK_IMPORT_REST_NAMESPACE,
			JETPACK_IMPORT_REST_PREFIX . '/posts',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( \WP_REST_Server::CREATABLE ),
				),
				'allow_batch' => array( 'v1' => true ),
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
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
		$posts = get_posts(
			array(
				'numberposts' => 1,
				'fields'      => 'ids',
				'meta_query'  => array(
					array(
						'key'   => JETPACK_IMPORT_ID_META_NAME,
						'value' => $parent_import_id,
					),
				),
			)
		);

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

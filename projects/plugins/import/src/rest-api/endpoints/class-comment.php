<?php
/**
 * Comments REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack_Import\REST_API\Endpoints;

/**
 * Comment Category
 */
class Comment extends \WP_REST_Comments_Controller {
	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import_ID;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		// @see add_comment_meta
		$this->import_id_meta_name = $this->rest_base;
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see WP_REST_Comments_Controller::register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			JETPACK_IMPORT_REST_NAMESPACE,
			JETPACK_IMPORT_REST_PREFIX . $this->rest_base,
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
	 * Update the comment parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$terms = get_terms(
			array(
				'taxonomy'   => 'post_tag',
				'number'     => 1,
				'fields'     => 'ids',
				'meta_query' => array(
					array(
						'key'   => JETPACK_IMPORT_ID_META_NAME,
						'value' => $parent_import_id,
					),
				),
			)
		);

		if ( is_array( $terms ) && count( $terms ) === 1 ) {
			$parent_id = $terms[0];

			wp_update_term( $resource_id, $this->import_id_meta_name, array( 'parent' => $parent_id ) );
		}
	}
}

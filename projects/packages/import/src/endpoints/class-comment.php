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
		$this->import_id_meta_name = $this->rest_base;
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
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'import_permissions_callback' ),
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
	 * @return bool True if updated.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$comments = get_comments(
			array(
				'number'     => 1,
				'fields'     => 'ids',
				'meta_query' => array(
					array(
						'key'   => 'unified_importer_id',
						'value' => $parent_import_id,
					),
				),
			)
		);

		if ( is_array( $comments ) && count( $comments ) === 1 ) {
			$parent_id = $comments[0];

			return (bool) wp_update_comment(
				array(
					'comment_ID'     => $resource_id,
					'comment_parent' => $parent_id,
				)
			);
		}

		return false;
	}
}

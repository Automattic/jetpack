<?php
/**
 * Tags REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Class Tag
 */
class Tag extends \WP_REST_Terms_Controller {

	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'post_tag' );

		// @see add_term_meta
		$this->import_id_meta_type = 'term';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @see WP_REST_Terms_Controller::register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			self::$rest_namespace,
			'/tags',
			$this->get_route_options()
		);
	}

	/**
	 * Update the tag parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 * @return bool True if updated.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$terms = \get_terms( $this->get_import_db_query( $parent_import_id ) );

		if ( is_array( $terms ) && count( $terms ) === 1 ) {
			$parent_id = $terms[0];

			return (bool) \wp_update_term( $resource_id, $this->import_id_meta_type, array( 'parent' => $parent_id ) );
		}

		return false;
	}
}

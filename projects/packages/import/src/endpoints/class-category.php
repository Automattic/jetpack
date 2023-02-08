<?php
/**
 * Categories REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Class Category
 */
class Category extends \WP_REST_Terms_Controller {

	/**
	 * The Import ID add a new item to the schema.
	 */
	use Import;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'category' );

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
			'/categories',
			$this->get_route_options()
		);
	}

	/**
	 * Update the category parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 * @return bool True if updated.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$categories = get_categories( $this->get_import_db_query( $parent_import_id ) );

		if ( is_array( $categories ) && count( $categories ) === 1 ) {
			$parent_id = $categories[0];

			return (bool) wp_update_category(
				array(
					'cat_ID'          => $resource_id,
					'category_parent' => $parent_id,
				)
			);
		}

		return false;
	}
}

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
	 * Adds the schema from additional fields to a schema array.
	 *
	 * The type of object is inferred from the passed schema.
	 *
	 * @param array $schema Schema array.
	 * @return array Modified Schema array.
	 */
	public function add_additional_fields_schema( $schema ) {
		// Parent term is saved like a slug in WXR so we have to rewrite the schema.
		$schema['properties']['parent']['description'] = __( 'The parent category slug.', 'jetpack-import' );
		$schema['properties']['parent']['type']        = 'string';

		// Add the import unique ID to the schema.
		return $this->add_unique_identifier_to_schema( $schema );
	}

	/**
	 * Creates a single category.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( isset( $request['parent'] ) ) {
			$parent = get_term_by( 'slug', $request['parent'], 'category' );

			// Overwrite the parent ID with the parent term ID found using the slug.
			$request['parent'] = $parent ? $parent->term_id : 0;
		}

		$response = parent::create_item( $request );

		return $this->add_import_id_metadata( $request, $response );
	}

	/**
	 * Update the category parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 * @return bool True if updated.
	 */
	protected function update_parent_id( $resource_id, $parent_import_id ) {
		$categories = \get_categories( $this->get_import_db_query( $parent_import_id ) );

		if ( is_array( $categories ) && count( $categories ) === 1 ) {
			$parent_id = $categories[0];

			return (bool) \wp_update_category(
				array(
					'cat_ID'          => $resource_id,
					'category_parent' => $parent_id,
				)
			);
		}

		return false;
	}
}

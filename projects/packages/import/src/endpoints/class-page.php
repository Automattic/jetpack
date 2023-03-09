<?php
/**
 * Pages REST route
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Class Page
 */
class Page extends Post {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'page' );
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
		// Add the import unique ID to the schema.
		return $this->add_unique_identifier_to_schema( $schema );
	}

	/**
	 * Creates a single page.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		if ( ! empty( $request['parent'] ) ) {
			$pages = \get_pages( $this->get_import_db_query( $request['parent'] ) );

			// Overwrite the page parent page ID.
			$request['parent'] = is_array( $pages ) && count( $pages ) ? $pages[0]->ID : 0;
		}

		$response = parent::create_item( $request );

		return $this->add_import_id_metadata( $request, $response );
	}
}

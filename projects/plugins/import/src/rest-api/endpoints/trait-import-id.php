<?php
/**
 * Jetpack Import unique import ID.
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack_Import\REST_API\Endpoints;

/**
 * Import ID trait. Add a unique import ID to the items schema.
 */
trait Import_ID {
	/**
	 * Import ID meta name
	 *
	 * @var string
	 */
	public $import_id_meta_name = null;

	/**
	 * Adds the schema from additional fields to a schema array.
	 *
	 * The type of object is inferred from the passed schema.
	 *
	 * @param array $schema Schema array.
	 * @return array Modified Schema array.
	 */
	public function add_additional_fields_schema( $schema ) {
		$schema['properties'][ JETPACK_IMPORT_ID_META_NAME ] = array(
			'description' => __( 'Jetpack Import unique identifier for the term.', 'jetpack-import' ),
			'type'        => 'integer',
			'context'     => array( 'view', 'embed', 'edit' ),
			'required'    => true,
		);

		return $schema;
	}

	/**
	 * Create a resource.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$response = parent::create_item( $request );

		// Skip if there resource has not been added.
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = $response->get_data();

		if ( $response->get_status() !== 201 ) {
			return $response;
		}

		// Add the import unique ID to the resource metadata.
		add_metadata( $this->import_id_meta_name, $data['id'], JETPACK_IMPORT_ID_META_NAME, $request[ JETPACK_IMPORT_ID_META_NAME ], true );

		// If the resource has a parent.
		if ( $request[ JETPACK_IMPORT_ID_META_NAME ] !== 0 ) {
			// Update the parent.
			$this->update_parent_id( $data['id'], $request[ JETPACK_IMPORT_ID_META_NAME ] );
		}

		return $response;
	}

	/**
	 * Update the resource parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 */
	abstract protected function update_parent_id( $resource_id, $parent_import_id );
}

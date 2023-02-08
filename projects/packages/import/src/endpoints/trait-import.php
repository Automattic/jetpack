<?php
/**
 * Jetpack Import unique import ID.
 *
 * @package automattic/jetpack-import
 */

namespace Automattic\Jetpack\Import\Endpoints;

/**
 * Import trait. Add a unique import ID to the items schema and authentication.
 */
trait Import {

	/**
	 * REST API namespace.
	 *
	 * @var string
	 */
	private static $rest_namespace = 'jetpack/v4/import';

	/**
	 * Import ID meta name.
	 *
	 * @var string
	 */
	public $import_id_meta_name;

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
		$schema['properties']['unified_importer_id'] = array(
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

		// Skip if the resource has not been added.
		if ( $response->get_status() !== 201 ) {
			return $response;
		}

		// Add the import unique ID to the resource metadata.
		add_metadata( $this->import_id_meta_name, $data['id'], 'unified_importer_id', $request['unified_importer_id'], true );

		// If the resource has a parent.
		if ( $request['unified_importer_id'] !== 0 ) {
			// Update the parent.
			$this->update_parent_id( $data['id'], $request['unified_importer_id'] );
		}

		return $response;
	}

	/**
	 * Ensure that the user has permissions to import.
	 *
	 * @return bool|\WP_Error
	 */
	public function import_permissions_callback() {
		// The permission check is done in the REST API authentication. It's the same
		// as the one used in wp-admin/import.php.
		if ( \current_user_can( 'import' ) ) {
			return true;
		}

		$error_msg = \esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-import'
		);

		return new \WP_Error( 'rest_forbidden', $error_msg, array( 'status' => \rest_authorization_required_code() ) );
	}

	/**
	 * Get the import DB query. This is used to get the items with a specific
	 * meta key that have been imported.
	 *
	 * @param int $parent_import_id The parent import ID.
	 * @return array The query.
	 */
	protected function get_import_db_query( $parent_import_id ) {
		// Get the only one item with the parent import ID.
		return array(
			'number'     => 1,
			'fields'     => 'ids',
			'meta_query' => array(
				array(
					'key'   => 'unified_importer_id',
					'value' => $parent_import_id,
				),
			),
		);
	}

	/**
	 * Update the resource parent ID.
	 *
	 * @param int $resource_id      The resource ID.
	 * @param int $parent_import_id The parent ID.
	 * @return bool True if updated.
	 */
	abstract protected function update_parent_id( $resource_id, $parent_import_id );
}

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
		);

		return $schema;
	}
}

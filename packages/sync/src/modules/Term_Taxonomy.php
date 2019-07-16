<?php
/**
 * Term taxonomy sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Defaults;

/**
 * Class to allow fetching of a row from term_taxonomy table.
 */
class Term_Taxonomy extends Module {

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'term_taxonomy';
	}

	/**
	 * Allows WordPress.com servers to retrieve a term_taxonomy object via the sync API.
	 *
	 * @param string $object_type The type of object.
	 * @param int    $id          A term_taxonomy_id.
	 *
	 * @return bool|object A row from the term_taxonomy table.
	 */
	public function get_object_by_id( $object_type, $id ) {
		global $wpdb;
		$columns = implode( ', ', array_unique( array_merge( Defaults::$default_term_taxonomy_checksum_columns, array( 'description' ) ) ) );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_row( $wpdb->prepare( "SELECT $columns FROM $wpdb->term_taxonomy WHERE term_taxonomy_id = %d", $id ) );
	}
}

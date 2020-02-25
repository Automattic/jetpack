<?php
/**
 * Meta sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

/**
 * Class to handle sync for meta.
 */
class Meta extends Module {
	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'meta';
	}

	/**
	 * This implementation of get_objects_by_id() is a bit hacky since we're not passing in an array of meta IDs,
	 * but instead an array of post or comment IDs for which to retrieve meta for. On top of that,
	 * we also pass in an associative array where we expect there to be 'meta_key' and 'ids' keys present.
	 *
	 * This seemed to be required since if we have missing meta on WP.com and need to fetch it, we don't know what
	 * the meta key is, but we do know that we have missing meta for a given post or comment.
	 *
	 * @todo Refactor the $wpdb->prepare call to use placeholders.
	 *
	 * @param string $object_type The type of object for which we retrieve meta. Either 'post' or 'comment'.
	 * @param array  $config      Must include 'meta_key' and 'ids' keys.
	 *
	 * @return array
	 */
	public function get_objects_by_id( $object_type, $config ) {
		global $wpdb;

		$table = _get_meta_table( $object_type );

		if ( ! $table ) {
			return array();
		}

		if ( ! isset( $config['meta_key'] ) || ! isset( $config['ids'] ) || ! is_array( $config['ids'] ) ) {
			return array();
		}

		$meta_key         = $config['meta_key'];
		$ids              = $config['ids'];
		$object_id_column = $object_type . '_id';

		// Sanitize so that the array only has integer values.
		$ids_string = implode( ', ', array_map( 'intval', $ids ) );
		$metas      = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE {$object_id_column} IN ( {$ids_string} ) AND meta_key = %s",
				$meta_key
			)
		);

		$meta_objects = array();
		foreach ( (array) $metas as $meta_object ) {
			$meta_object                                       = (array) $meta_object;
			$meta_objects[ $meta_object[ $object_id_column ] ] = array(
				'meta_type'  => $object_type,
				'meta_id'    => $meta_object['meta_id'],
				'meta_key'   => $meta_key,
				'meta_value' => $meta_object['meta_value'],
				'object_id'  => $meta_object[ $object_id_column ],
			);
		}

		return $meta_objects;
	}
}

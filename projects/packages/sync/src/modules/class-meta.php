<?php
/**
 * Meta sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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

		if ( ! is_array( $config ) ) {
			return array();
		}

		$object_id_column = $object_type . '_id';
		$object_key_pairs = array();

		foreach ( $config as $item ) {
			if ( isset( $item['id'] ) && isset( $item['meta_key'] ) ) {
				$object_key_pairs[ (int) $item['id'] ][] = (string) $item['meta_key'];
			}
		}

		$meta_objects         = array();
		$where_sql            = '';
		$current_query_length = 0;

		foreach ( $object_key_pairs as $object_id => $keys ) {
			$keys_placeholders = implode( ',', array_fill( 0, count( $keys ), '%s' ) );
			$where_condition   = trim(
				$wpdb->prepare(
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					"( `$object_id_column` = %d AND meta_key IN ( $keys_placeholders ) )",
					array_merge( array( $object_id ), $keys )
				)
			);

			$where_sql = empty( $where_sql ) ? $where_condition : $where_sql . ' OR ' . $where_condition;

			$current_query_length += strlen( $where_sql );

			if ( $current_query_length > self::MAX_DB_QUERY_LENGTH ) {
				$meta_objects         = $this->fetch_prepared_meta_from_db( $object_type, $where_sql, $meta_objects );
				$where_sql            = '';
				$current_query_length = 0;
			}
		}

		if ( ! empty( $where_sql ) ) {
			$meta_objects = $this->fetch_prepared_meta_from_db( $object_type, $where_sql, $meta_objects );
		}

		return $meta_objects;
	}

	/**
	 * Get a single Meta Result.
	 *
	 * @param string      $object_type  post, comment, term, user.
	 * @param int|null    $id           Object ID.
	 * @param string|null $meta_key     Meta Key.
	 *
	 * @return mixed|null
	 */
	public function get_object_by_id( $object_type, $id = null, $meta_key = null ) {
		global $wpdb;

		if ( ! is_int( $id ) || ! is_string( $meta_key ) ) {
			return null;
		}

		$table = _get_meta_table( $object_type );

		if ( ! $table ) {
			return null;
		}

		$object_id_column = $object_type . '_id';

		// Sanitize so that the array only has integer values.
		$where_condition = $wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"{$object_id_column} = %d AND meta_key = %s",
			$id,
			$meta_key
		);

		$meta_objects = $this->fetch_prepared_meta_from_db( $object_type, $where_condition );

		$key = $id . '-' . $meta_key;

		return $meta_objects[ $key ] ?? null;
	}

	/**
	 * Fetch meta from DB and return them in a standard format.
	 *
	 * @param  string $object_type   The meta object type, eg 'post', 'user' etc.
	 * @param  string $where         Prepared SQL 'where' statement.
	 * @param  array  $meta_objects  An existing array of meta to populate. Defaults to an empty array.
	 * @return array
	 */
	private function fetch_prepared_meta_from_db( $object_type, $where, $meta_objects = array() ) {
		global $wpdb;

		$table            = _get_meta_table( $object_type );
		$object_id_column = $object_type . '_id';

		$meta = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"SELECT * FROM {$table} WHERE {$where}",
			ARRAY_A
		);

		if ( ! is_wp_error( $meta ) && ! empty( $meta ) ) {
			foreach ( $meta as $meta_entry ) {
				$object_id = $meta_entry[ $object_id_column ];
				$meta_key  = $meta_entry['meta_key'];
				$key       = $object_id . '-' . $meta_key;

				if ( ! isset( $meta_objects[ $key ] ) ) {
					$meta_objects[ $key ] = array();
				}

				$meta_objects[ $key ][] = $this->get_prepared_meta_object( $object_type, $meta_entry );
			}
		}

		return $meta_objects;
	}

	/**
	 * Accepts a DB meta entry and returns it in a standard format.
	 *
	 * @param  string $object_type The meta object type, eg 'post', 'user' etc.
	 * @param  array  $meta_entry  A meta array.
	 * @return array
	 */
	private function get_prepared_meta_object( $object_type, $meta_entry ) {
		$object_id_column = $object_type . '_id';

		if ( 'post' === $object_type && strlen( $meta_entry['meta_value'] ) >= Posts::MAX_META_LENGTH ) {
			$meta_entry['meta_value'] = '';
		}

		return array(
			'meta_type'  => $object_type,
			'meta_id'    => $meta_entry['meta_id'],
			'meta_key'   => $meta_entry['meta_key'],
			'meta_value' => $meta_entry['meta_value'],
			'object_id'  => $meta_entry[ $object_id_column ],
		);
	}
}

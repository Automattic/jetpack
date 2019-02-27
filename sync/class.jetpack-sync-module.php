<?php

/**
 * Basic methods implemented by Jetpack Sync extensions
 */
abstract class Jetpack_Sync_Module {
	const ARRAY_CHUNK_SIZE = 10;

	abstract public function name();

	public function get_object_by_id( $object_type, $id ) {
		return false;
	}

	// override these to set up listeners and set/reset data/defaults
	public function init_listeners( $callable ) {
	}

	public function init_full_sync_listeners( $callable ) {
	}

	public function init_before_send() {
	}

	public function set_defaults() {
	}

	public function reset_data() {
	}

	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		// in subclasses, return the number of actions enqueued, and next module state (true == done)
		return array( 0, true );
	}

	public function estimate_full_sync_actions( $config ) {
		// in subclasses, return the number of items yet to be enqueued
		return 0;
	}

	public function get_full_sync_actions() {
		return array();
	}

	protected function count_actions( $action_names, $actions_to_count ) {
		return count( array_intersect( $action_names, $actions_to_count ) );
	}

	protected function get_check_sum( $values ) {
		return crc32( wp_json_encode( jetpack_json_wrap( $values ) ) );
	}

	protected function still_valid_checksum( $sums_to_check, $name, $new_sum ) {
		if ( isset( $sums_to_check[ $name ] ) && $sums_to_check[ $name ] === $new_sum ) {
			return true;
		}

		return false;
	}

	protected function enqueue_all_ids_as_action( $action_name, $table_name, $id_field, $where_sql, $max_items_to_enqueue, $state ) {
		global $wpdb;

		if ( ! $where_sql ) {
			$where_sql = '1 = 1';
		}

		$items_per_page  = 1000;
		$page            = 1;
		$chunk_count     = 0;
		$previous_max_id = $state ? $state : '~0';
		$listener        = Jetpack_Sync_Listener::get_instance();

		// count down from max_id to min_id so we get newest posts/comments/etc first
		while ( $ids = $wpdb->get_col( "SELECT {$id_field} FROM {$table_name} WHERE {$where_sql} AND {$id_field} < {$previous_max_id} ORDER BY {$id_field} DESC LIMIT {$items_per_page}" ) ) {
			// Request posts in groups of N for efficiency
			$chunked_ids = array_chunk( $ids, self::ARRAY_CHUNK_SIZE );

			// if we hit our row limit, process and return
			if ( $chunk_count + count( $chunked_ids ) >= $max_items_to_enqueue ) {
				$remaining_items_count = $max_items_to_enqueue - $chunk_count;
				$remaining_items       = array_slice( $chunked_ids, 0, $remaining_items_count );

				$listener->bulk_enqueue_full_sync_actions( $action_name, $remaining_items );

				$last_chunk = end( $remaining_items );
				return array( $remaining_items_count + $chunk_count, end( $last_chunk ) );
			}

			$listener->bulk_enqueue_full_sync_actions( $action_name, $chunked_ids );

			$chunk_count    += count( $chunked_ids );
			$page           += 1;
			$previous_max_id = end( $ids );
		}

		return array( $chunk_count, true );
	}

	protected function get_metadata( $ids, $meta_type, $meta_key_whitelist ) {
		global $wpdb;
		$table = _get_meta_table( $meta_type );
		$id    = $meta_type . '_id';
		if ( ! $table ) {
			return array();
		}

		$private_meta_whitelist_sql = "'" . implode( "','", array_map( 'esc_sql', $meta_key_whitelist ) ) . "'";

		return array_map(
			array( $this, 'unserialize_meta' ),
			$wpdb->get_results(
				"SELECT $id, meta_key, meta_value, meta_id FROM $table WHERE $id IN ( " . implode( ',', wp_parse_id_list( $ids ) ) . ' )' .
				" AND meta_key IN ( $private_meta_whitelist_sql ) ",
				OBJECT
			)
		);
	}

	public function init_listeners_for_meta_type( $meta_type, $callable ) {
		add_action( "added_{$meta_type}_meta", $callable, 10, 4 );
		add_action( "updated_{$meta_type}_meta", $callable, 10, 4 );
		add_action( "deleted_{$meta_type}_meta", $callable, 10, 4 );
	}

	public function init_meta_whitelist_handler( $meta_type, $whitelist_handler ) {
		add_filter( "jetpack_sync_before_enqueue_added_{$meta_type}_meta", $whitelist_handler );
		add_filter( "jetpack_sync_before_enqueue_updated_{$meta_type}_meta", $whitelist_handler );
		add_filter( "jetpack_sync_before_enqueue_deleted_{$meta_type}_meta", $whitelist_handler );
	}

	protected function get_term_relationships( $ids ) {
		global $wpdb;

		return $wpdb->get_results( "SELECT object_id, term_taxonomy_id FROM $wpdb->term_relationships WHERE object_id IN ( " . implode( ',', wp_parse_id_list( $ids ) ) . ' )', OBJECT );
	}

	public function unserialize_meta( $meta ) {
		$meta->meta_value = maybe_unserialize( $meta->meta_value );
		return $meta;
	}

	public function get_objects_by_id( $object_type, $ids ) {
		if ( empty( $ids ) || empty( $object_type ) ) {
			return array();
		}

		$objects = array();
		foreach ( (array) $ids as $id ) {
			$object = $this->get_object_by_id( $object_type, $id );

			// Only add object if we have the object.
			if ( $object ) {
				$objects[ $id ] = $object;
			}
		}

		return $objects;
	}
}

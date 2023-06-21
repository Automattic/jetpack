<?php

namespace Automattic\Jetpack\Sync\Queue;

class Queue_Storage_Options {
	public function __construct( $queue_id ) {
		if ( empty( $queue_id ) ) {
			// TODO what should we return here or throw an exception?
			throw new Exception( 'Invalid queue_id provided' );
		}

		// TODO validate the value maybe?
		$this->queue_id = $queue_id;
	}

	public function insert_item( $item_id, $item ) {
		global $wpdb;

		$rows_added = $wpdb->query(
			$wpdb->prepare(
				"INSERT INTO $wpdb->options (option_name, option_value, autoload) VALUES (%s, %s,%s)",
				$item_id,
				$item,
				'no'
			)
		);

		return ( 0 !== $rows_added );
	}

	public function fetch_items( $item_count ) {
		global $wpdb;

		// TODO make it more simple for the $item_count
		if ( $item_count ) {
			$items = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT %d",
					"jpsq_{$this->queue_id}-%",
					$item_count
				),
				OBJECT
			);
		} else {
			$items = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC",
					"jpsq_{$this->queue_id}-%"
				),
				OBJECT
			);
		}

		return $items;
	}

	public function fetch_items_by_ids( $items_ids ) {
		global $wpdb;

		// return early if $items_ids is empty or not an array.
		if ( empty( $items_ids ) || ! is_array( $items_ids ) ) {
			return array();
		}

		$ids_placeholders = implode( ', ', array_fill( 0, count( $items_ids ), '%s' ) );

		$query_with_placeholders = "SELECT option_name AS id, option_value AS value
				FROM $wpdb->options
				WHERE option_name IN ( $ids_placeholders )";

		$items = $wpdb->get_results(
			$wpdb->prepare(
				$query_with_placeholders, // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$items_ids
			),
			OBJECT
		);

		return $items;
	}

	public function delete_item() {
	}

	public function find() {
	}

	public function clear_queue() {
		global $wpdb;

		return $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM $wpdb->options WHERE option_name LIKE %s",
				"jpsq_{$this->queue_id}-%"
			)
		);
	}

	public function get_item_count() {
		global $wpdb;

		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT count(*) FROM $wpdb->options WHERE option_name LIKE %s",
				"jpsq_{$this->queue_id}-%"
			)
		);
	}

	public function get_lag( $now = null ) {
		global $wpdb;

		// TODO replace with peek and a flag to fetch only the name.
		$first_item_name = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT option_name FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT 1",
				"jpsq_{$this->queue_id}-%"
			)
		);

		if ( ! $first_item_name ) {
			return 0;
		}

		if ( null === $now ) {
			$now = microtime( true );
		}

		// Break apart the item name to get the timestamp.
		$matches = null;
		if ( preg_match( '/^jpsq_' . $this->queue_id . '-(\d+\.\d+)-/', $first_item_name, $matches ) ) {
			return $now - (float) $matches[1];
		} else {
			return 0;
		}
	}

	public function add_all( $items, $id_prefix ) {
		global $wpdb;

		$query = "INSERT INTO $wpdb->options (option_name, option_value, autoload) VALUES ";

		$rows        = array();
		$count_items = count( $items );
		for ( $i = 0; $i < $count_items; ++$i ) {
			// skip empty items.
			if ( empty( $items[ $i ] ) ) {
				continue;
			}
			try {
				$option_name  = esc_sql( $id_prefix . '-' . $i );
				$option_value = esc_sql( serialize( $items[ $i ] ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
				$rows[]       = "('$option_name', '$option_value', 'no')";
			} catch ( \Exception $e ) {
				// Item cannot be serialized so skip.
				continue;
			}
		}

		$rows_added = $wpdb->query( $query . implode( ',', $rows ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

		return $rows_added;
	}

	public function get_items_ids_with_size( $max_count ) {
		global $wpdb;

		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT option_name AS id, LENGTH(option_value) AS value_size FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT %d",
				"jpsq_{$this->queue_id}-%",
				$max_count
			),
			OBJECT
		);
	}

	public function delete_items_by_ids( $ids ) {
		global $wpdb;
		// TODO check if it's working properly - no need to delete all options in the table if the params are not right
		$ids_placeholders = implode( ', ', array_fill( 0, count( $ids ), '%s' ) );

		$sql = "DELETE FROM {$wpdb->options} WHERE option_name IN ( $ids_placeholders )";

		return $wpdb->query( $wpdb->prepare( $sql, $ids ) );
	}
}

<?php

namespace Automattic\Jetpack\Sync\Queue;

class Queue_Storage_Options {
	public function __construct() {
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

	public function fetch_items( $queue_id, $item_count ) {
		global $wpdb;

		// TODO make it more simple for the $item_count
		if ( $item_count ) {
			$items = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT %d",
					"jpsq_{$queue_id}-%",
					$item_count
				),
				OBJECT
			);
		} else {
			$items = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC",
					"jpsq_{$queue_id}-%"
				),
				OBJECT
			);
		}

		return $items;
	}

	public function fetch_items_by_ids( $queue_id, $items_ids ) {
		global $wpdb;
		// TODO implement

		// return early if $items_ids is empty or not an array.
		if ( empty( $items_ids ) || ! is_array( $items_ids ) ) {
			return null;
		}

		$ids_placeholders        = implode( ', ', array_fill( 0, count( $items_ids ), '%s' ) );
		$query_with_placeholders = "SELECT option_name AS id, option_value AS value
				FROM $wpdb->options
				WHERE option_name IN ( $ids_placeholders )";
		$items                   = $wpdb->get_results(
			$wpdb->prepare(
				$query_with_placeholders, // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$items_ids
			),
			OBJECT
		);

		return $this->unserialize_values( $items );
	}

	public function delete_item() {
	}

	public function find() {
	}

	public function clear_queue( $queue_name ) {
		global $wpdb;

		return $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM $wpdb->options WHERE option_name LIKE %s",
				"jpsq_{$queue_name}-%"
			)
		);
	}

	public function get_item_count( $queue_name ) {
		global $wpdb;

		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT count(*) FROM $wpdb->options WHERE option_name LIKE %s",
				"jpsq_{$queue_name}-%"
			)
		);
	}

	public function get_lag( $queue_name, $now = null ) {
		global $wpdb;

		// TODO replace with peek and a flag to fetch only the name.
		$first_item_name = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT option_name FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT 1",
				"jpsq_{$queue_name}-%"
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
		if ( preg_match( '/^jpsq_' . $this->id . '-(\d+\.\d+)-/', $first_item_name, $matches ) ) {
			return $now - (float) $matches[1];
		} else {
			return 0;
		}
	}

}

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

}

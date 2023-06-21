<?php

namespace Automattic\Jetpack\Sync\Queue;

class Queue_Storage_Table {
	public $table_name_no_prefix = 'jetpack_sync_queue';
	/**
	 * @var string The table name with the DB prefix.
	 */
	public $table_name = '';

	public $queue_id = '';

	public function __construct( $queue_id ) {
		global $wpdb;

		if ( empty( $queue_id ) ) {
			// TODO what should we return here or throw an exception?
			throw new Exception( 'Invalid queue_id provided' );
		}

		// TODO validate the value maybe?
		$this->queue_id = $queue_id;

		// Initialize the `table_name` property with the correct prefix for easier usage in the class.
		$this->table_name = $wpdb->prefix . $this->table_name_no_prefix;
	}

	/**
	 * Creates the new table and updates the options to work with the new table if it was created successfully.
	 *
	 * @return void
	 */
	public function create_table() {
		global $wpdb;

		// TODO if we run this only in the context of an upgrade, we should not include this here.
		require_once ABSPATH . '/wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();

		$table_definition = "CREATE TABLE {$this->table_name} (
			  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
			  `queue_id` varchar(50) NOT NULL,
			  `event_id` varchar(100) NOT NULL,
			  `event_payload` text NOT NULL,
			  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
			  `object_type` varchar(100) DEFAULT NULL,
			  `parent_object_id` bigint(20) DEFAULT NULL,
			  PRIMARY KEY (`ID`),
			  KEY `event_id` (`event_id`),
			  KEY `queue_id` (`queue_id`),
			  KEY `queue_id_event_id` (queue_id, event_id),
			  KEY `timestamp` (`timestamp`),
			  KEY `object_type` (`object_type`),
			  KEY `parent_object_id` (`parent_object_id`)
			) $charset_collate;";

		/**
		 * dbDelta will only return the differences. If the table exists, the result will be empty, so let's run
		 * a check afterward to see if the table exists and is healthy.
		 */
		\dbDelta( $table_definition );
	}

	/**
	 * Check if the table is healthy, and we can read and write from/to it.
	 *
	 * @return bool If the dedicated table is available, and we can read and write from/to it.
	 */
	public function is_dedicated_table_healthy() {
		global $wpdb;
		// Check if the table exists
		$query = $wpdb->prepare( 'SHOW TABLES LIKE %s', $this->table_name );

		$result = $wpdb->get_row( $query, ARRAY_N );
		if ( empty( $result ) || count( $result ) !== 1 || $result[0] !== $this->table_name ) {
			return false;
		}

		// TODO check if we can read and write
		// TODO Check count of items or if it can read the count and it's not an error.

		// TODO check errors?

		return true;
	}

	public function disable_dedicated_table_usage() {
		// TODO disable the option to use the table
		// TODO check if healthy
		// TODO migrate to the main queue class.
	}

	/**
	 * Drop the dedicated table as part of cleanup.
	 *
	 * @return bool If the table is cleared. It's using `is_dedicated_table_healthy` to check.
	 */
	public function drop_table() {
		global $wpdb;

		// TODO do we need to check if the table is healthy or not before dropping it?
		if ( ! $this->is_dedicated_table_healthy() ) {
			return false;
		}

		$wpdb->query( "DROP TABLE {$this->table_name}" );

		return ! $this->is_dedicated_table_healthy();
	}

	/**
	 * Queue API implementation
	 */

	public function insert_item( $item_id, $item ) {
		global $wpdb;

		$rows_added = $wpdb->query(
			$wpdb->prepare(
				"INSERT INTO {$this->table_name} (queue_id, event_id, event_payload) VALUES (%s, %s,%s)",
				$this->queue_id,
				$item_id,
				$item
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
					"
						SELECT
	                        event_id AS id,
	                        event_payload AS value
						FROM {$this->table_name}
							WHERE queue_id LIKE %s
						ORDER BY event_id ASC
						LIMIT %d
					",
					$this->queue_id,
					$item_count
				)
			);
		} else {
			$items = $wpdb->get_results(
				$wpdb->prepare(
					"
						SELECT
	                        event_id AS id,
	                        event_payload AS value
						FROM {$this->table_name}
							WHERE queue_id LIKE %s
						ORDER BY event_id ASC
					",
					$this->queue_id
				)
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

		$ids_placeholders        = implode( ', ', array_fill( 0, count( $items_ids ), '%s' ) );
		$query_with_placeholders = "SELECT event_id AS id, event_payload AS value
				FROM {$this->table_name}
				WHERE queue_id = %s AND event_id IN ( $ids_placeholders )";

		$replacement_values = array_merge( array( $this->queue_id ), $items_ids );

		$items = $wpdb->get_results(
			$wpdb->prepare(
				$query_with_placeholders, // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$replacement_values
			),
			OBJECT
		);

		return $items;
	}

	public function get_item_count() {
		global $wpdb;

		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT count(*) FROM {$this->table_name} WHERE queue_id = %s",
				$this->queue_id
			)
		);
	}
	// TODO pending implementation

	public function clear_queue() {
		global $wpdb;

		return $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$this->table_name} WHERE queue_id = %s",
				$this->queue_id
			)
		);
	}

	public function get_lag( $now = null ) {
		global $wpdb;

		// TODO replace with peek and a flag to fetch only the name.
		$first_item_name = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT event_id FROM {$this->table_name} WHERE queue_id = %s ORDER BY event_id ASC LIMIT 1",
				$this->queue_id
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

		$query = "INSERT INTO {$this->table_name} (queue_id, event_id, event_payload ) VALUES ";

		$rows        = array();
		$count_items = count( $items );
		for ( $i = 0; $i < $count_items; ++$i ) {
			// skip empty items.
			if ( empty( $items[ $i ] ) ) {
				continue;
			}
			try {
				$event_id      = esc_sql( $id_prefix . '-' . $i );
				$event_payload = esc_sql( serialize( $items[ $i ] ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
				$rows[]        = "('{$this->queue_id}', '$event_id','$event_payload')";
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

		// TODO optimize the fetch to happen by queue name not by the IDs as it can be issue cross-queues.
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT event_id AS id, LENGTH(event_payload) AS value_size FROM {$this->table_name} WHERE queue_id = %s ORDER BY event_id ASC LIMIT %d",
				$this->queue_id,
				$max_count
			),
			OBJECT
		);
	}

	public function delete_items_by_ids( $ids ) {
		global $wpdb;
		$ids_placeholders = implode( ', ', array_fill( 0, count( $ids ), '%s' ) );

		$sql = "DELETE FROM {$this->table_name} WHERE queue_id = %s AND event_id IN ( $ids_placeholders )";

		return $wpdb->query( $wpdb->prepare( $sql, array_merge( array( $this->queue_id ), $ids ) ) );
	}
}

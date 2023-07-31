<?php
/**
 * The class responsible for storing Queue events in a custom Sync events table.
 *
 * Used by class Queue.
 *
 * @see \Automattic\Jetpack\Sync\Queue
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Queue;

/**
 * Custom Sync events table storage backend for the Queue.
 */
class Queue_Storage_Table {
	/**
	 * The custom Sync events table name, without a prefix.
	 * A prefix will be added when the class is instantiated,
	 * as we fetch the prefix from `$wpdb` as is configured in
	 * the WordPress config file.
	 *
	 * @var string
	 */
	public $table_name_no_prefix = 'jetpack_sync_queue';

	/**
	 * The table name with the DB prefix.
	 *
	 * @var string
	 */
	public $table_name = '';

	/**
	 * What queue is this instance responsible for.
	 *
	 * @var string
	 */
	public $queue_id = '';

	/**
	 * Class constructor.
	 *
	 * @param string $queue_id The queue name this instance will be responsible for.
	 *
	 * @throws \Exception If queue name was not provided.
	 */
	public function __construct( $queue_id ) {
		global $wpdb;

		if ( empty( $queue_id ) ) {
			// TODO what should we return here or throw an exception?
			throw new \Exception( 'Invalid queue_id provided' );
		}

		// TODO validate the value maybe?
		$this->queue_id = $queue_id;

		// Initialize the `table_name` property with the correct prefix for easier usage in the class.
		$this->table_name = $wpdb->prefix . $this->table_name_no_prefix;
	}

	/**
	 * Creates the new table and updates the options to work with
	 * the new table if it was created successfully.
	 *
	 * @return void
	 */
	private function create_table() {
		global $wpdb;

		// TODO if we run this only in the context of an upgrade, we should not include this here.
		require_once ABSPATH . '/wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();

		$table_definition = "CREATE TABLE {$this->table_name} (
			  `ID` bigint(20) NOT NULL AUTO_INCREMENT,
			  `queue_id` varchar(50) NOT NULL,
			  `event_id` varchar(100) NOT NULL,
			  `event_payload` longtext NOT NULL,
			  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
			  PRIMARY KEY (`ID`),
			  KEY `event_id` (`event_id`),
			  KEY `queue_id` (`queue_id`),
			  KEY `queue_id_event_id` (queue_id, event_id),
			  KEY `timestamp` (`timestamp`)
			) $charset_collate;";

		/**
		 * The function dbDelta will only return the differences. If the table exists, the result will be empty,
		 * so let's run a check afterward to see if the table exists and is healthy.
		 */
		\dbDelta( $table_definition );
	}

	/**
	 * Check if the Custom table actually exists.
	 *
	 * @return bool
	 */
	private function custom_table_exists() {
		global $wpdb;

		// Check if the table exists
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$result = $wpdb->get_row(
			$wpdb->prepare( 'SHOW TABLES LIKE %s', $this->table_name ),
			ARRAY_N
		);

		if ( empty( $result ) || count( $result ) !== 1 || $result[0] !== $this->table_name ) {
			return false;
		}

		return true;
	}
	/**
	 * Check if the table is healthy, and we can read and write from/to it.
	 *
	 * @return bool If the custom table is available, and we can read and write from/to it.
	 */
	private function is_custom_table_healthy() {
		global $wpdb;

		if ( ! $this->custom_table_exists() ) {
			return false;
		}

		// Try to read from the table

		// Ignore the interpolated table name
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$query = $wpdb->query( "SELECT count(`ID`) FROM {$this->table_name}" );

		if ( $query === false ) {
			// The query failed to select anything from the table, so there must be an issue reading from it.
			return false;
		}

		if ( $wpdb->last_error ) {
			// There was an error reading, that's not necessarily failing the query.
			// TODO check if we need this error check.
			return false;
		}

		return true;
	}

	/**
	 * Drop the custom table as part of cleanup.
	 *
	 * @return bool If the table is cleared.
	 */
	public function drop_table() {
		global $wpdb;

		// Ignoring the linting warning, as there's still no placeholder replacement for DB field name.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.SchemaChange
		return (bool) $wpdb->query( "DROP TABLE {$this->table_name}" );
	}

	/**
	 * Queue API implementation
	 */

	/**
	 * Insert an item in the queue.
	 *
	 * @param string $item_id The item ID.
	 * @param string $item Serialized item data.
	 *
	 * @return bool If the item was added.
	 */
	public function insert_item( $item_id, $item ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows_added = $wpdb->query(
			$wpdb->prepare(
				/**
				 * Ignoring the linting warning, as there's still no placeholder replacement for DB field name,
				 * in this case this is `$this->table_name`
				 */
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"INSERT INTO {$this->table_name} (queue_id, event_id, event_payload) VALUES (%s, %s,%s)",
				$this->queue_id,
				$item_id,
				$item
			)
		);

		return ( 0 !== $rows_added );
	}

	/**
	 * Fetch items from the queue.
	 *
	 * @param int|null $item_count How many items to fetch from the queue.
	 *                             The parameter is null-able, if no limit on the amount of items.
	 *
	 * @return array|object|stdClass[]|null
	 */
	public function fetch_items( $item_count ) {
		global $wpdb;

		/**
		 * Ignoring the linting warning, as there's still no placeholder replacement for DB field name,
		 * in this case this is `$this->table_name`
		 */
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		// TODO make it more simple for the $item_count
		if ( $item_count ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
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
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
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

		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return $items;
	}

	/**
	 * Fetches items with specific IDs from the Queue.
	 *
	 * @param array $items_ids Items IDs to fetch from the queue.
	 *
	 * @return array|object|stdClass[]|null
	 */
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

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$items = $wpdb->get_results(
			$wpdb->prepare(
				$query_with_placeholders, // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$replacement_values
			),
			OBJECT
		);

		return $items;
	}

	/**
	 * Check how many items are in the queue.
	 *
	 * @return int
	 */
	public function get_item_count() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				/**
				 * Ignoring the linting warning, as there's still no placeholder replacement for DB field name,
				 * in this case this is `$this->table_name`
				 */
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT count(*) FROM {$this->table_name} WHERE queue_id = %s",
				$this->queue_id
			)
		);
	}

	/**
	 * Clear out the queue.
	 *
	 * @return bool|int|\mysqli_result|resource|null
	 */
	public function clear_queue() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->query(
			$wpdb->prepare(
				/**
				 * Ignoring the linting warning, as there's still no placeholder replacement for DB field name,
				 * in this case this is `$this->table_name`
				 */
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"DELETE FROM {$this->table_name} WHERE queue_id = %s",
				$this->queue_id
			)
		);
	}

	/**
	 * Return the lag amount for the queue.
	 *
	 * @param float|int|null $now A timestamp to use as starting point when calculating the lag.
	 *
	 * @return float|int The lag amount.
	 */
	public function get_lag( $now = null ) {
		global $wpdb;

		// TODO replace with peek and a flag to fetch only the name.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$first_item_name = $wpdb->get_var(
			$wpdb->prepare(
				/**
				 * Ignoring the linting warning, as there's still no placeholder replacement for DB field name,
				 * in this case this is `$this->table_name`
				 */
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
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

	/**
	 * Add multiple items to the queue at once.
	 *
	 * @param array  $items Array of items to add.
	 * @param string $id_prefix Prefix to use for all the items.
	 *
	 * @return bool|int|\mysqli_result|resource|null
	 */
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

	/**
	 * Return $max_count items from the queue, including their value string length.
	 *
	 * @param int $max_count How many items to fetch from the queue.
	 *
	 * @return array|object|stdClass[]|null
	 */
	public function get_items_ids_with_size( $max_count ) {
		global $wpdb;

		// TODO optimize the fetch to happen by queue name not by the IDs as it can be issue cross-queues.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_results(
			$wpdb->prepare(
				/**
				 * Ignoring the linting warning, as there's still no placeholder replacement for DB field name,
				 * in this case this is `$this->table_name`
				 */
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT event_id AS id, LENGTH( event_payload ) AS value_size FROM {$this->table_name} WHERE queue_id = %s ORDER BY event_id ASC LIMIT %d",
				$this->queue_id,
				$max_count
			),
			OBJECT
		);
	}

	/**
	 * Delete items with specific IDs from the queue.
	 *
	 * @param array $ids IDs of the items to remove from the queue.
	 *
	 * @return bool|int|\mysqli_result|resource|null
	 */
	public function delete_items_by_ids( $ids ) {
		global $wpdb;
		$ids_placeholders = implode( ', ', array_fill( 0, count( $ids ), '%s' ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->query(
			$wpdb->prepare(
				/**
				 * Ignoring the linting warning, as there's still no placeholder replacement for DB field name,
				 * in this case this is `$this->table_name`
				 */
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"DELETE FROM {$this->table_name} WHERE queue_id = %s AND event_id IN ( $ids_placeholders )",
				array_merge( array( $this->queue_id ), $ids )
			)
		);
	}
}

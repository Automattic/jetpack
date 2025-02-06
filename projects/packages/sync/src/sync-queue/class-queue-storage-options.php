<?php
/**
 * The class responsible for storing Queue events in the `wp_options` table.
 *
 * Used by class Queue.
 *
 * @see \Automattic\Jetpack\Sync\Queue
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Queue;

/**
 * `wp_options` storage backend for the Queue.
 */
class Queue_Storage_Options {
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
		if ( empty( $queue_id ) ) {
			// TODO what should we return here or throw an exception?
			throw new \Exception( 'Invalid queue_id provided' );
		}

		// TODO validate the value maybe?
		$this->queue_id = $queue_id;
	}

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

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
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

	/**
	 * Fetch items from the queue.
	 *
	 * @param int|null $item_count How many items to fetch from the queue.
	 *                             The parameter is null-able, if no limit on the amount of items.
	 *
	 * @return array|object|\stdClass[]|null
	 */
	public function fetch_items( $item_count ) {
		global $wpdb;

		// TODO make it more simple for the $item_count
		if ( $item_count ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
			$items = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT %d",
					"jpsq_{$this->queue_id}-%",
					$item_count
				),
				OBJECT
			);
		} else {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
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

	/**
	 * Fetches items with specific IDs from the Queue.
	 *
	 * @param array $items_ids Items IDs to fetch from the queue.
	 *
	 * @return \stdClass[]|null
	 */
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

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
		$items = $wpdb->get_results(
			$wpdb->prepare(
				$query_with_placeholders, // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
				$items_ids
			),
			OBJECT
		);

		return $items;
	}

	/**
	 * Clear out the queue.
	 *
	 * @return bool|int|\mysqli_result|resource|null
	 */
	public function clear_queue() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
		return $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM $wpdb->options WHERE option_name LIKE %s",
				"jpsq_{$this->queue_id}-%"
			)
		);
	}

	/**
	 * Check how many items are in the queue.
	 *
	 * @return int
	 */
	public function get_item_count() {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT count(*) FROM $wpdb->options WHERE option_name LIKE %s",
				"jpsq_{$this->queue_id}-%"
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
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
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

	/**
	 * Return $max_count items from the queue, including their value string length.
	 *
	 * @param int $max_count How many items to fetch from the queue.
	 *
	 * @return object[]|null
	 */
	public function get_items_ids_with_size( $max_count ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT option_name AS id, LENGTH(option_value) AS value_size FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT %d",
				"jpsq_{$this->queue_id}-%",
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

		if ( ! is_array( $ids ) || empty( $ids ) ) {
			return false;
		}

		// TODO check if it's working properly - no need to delete all options in the table if the params are not right
		$ids_placeholders = implode( ', ', array_fill( 0, count( $ids ), '%s' ) );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery
		return $wpdb->query(
			$wpdb->prepare(
			/**
			 * Ignoring the linting warning, as there's still no placeholder replacement for DB field name,
			 * in this case this is `$ids_placeholders`, as we're preparing them above and are a dynamic count.
			 */
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
				"DELETE FROM {$wpdb->options} WHERE option_name IN ( $ids_placeholders )",
				$ids
			)
		);
	}
}

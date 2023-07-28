<?php
/**
 * The class that describes the Queue for the sync package.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Sync\Queue\Queue_Storage_Options;
use WP_Error;

/**
 * A persistent queue that can be flushed in increments of N items,
 * and which blocks reads until checked-out buffers are checked in or
 * closed. This uses raw SQL for two reasons: speed, and not triggering
 * tons of added_option callbacks.
 */
class Queue {
	/**
	 * The queue id.
	 *
	 * @var string
	 */
	public $id;

	/**
	 * Keeps track of the rows.
	 *
	 * @var int
	 */
	private $row_iterator;

	/**
	 * Random number.
	 *
	 * @var int
	 */
	public $random_int;

	/**
	 * Queue Storage instance where we'll store the queue items.
	 *
	 * For now it's only the Options table. To be updated to include the Custom table in future updates.
	 *
	 * @var Queue_Storage_Options|null
	 */
	public $queue_storage = null;

	/**
	 * Queue constructor.
	 *
	 * @param string $id Name of the queue.
	 */
	public function __construct( $id ) {
		$this->id           = str_replace( '-', '_', $id ); // Necessary to ensure we don't have ID collisions in the SQL.
		$this->row_iterator = 0;
		$this->random_int   = wp_rand( 1, 1000000 );

		// Initialize the storage with the Options table backend. To be changed in subsequent updates to include the logic to switch to Custom Table.
		$this->queue_storage = new Queue_Storage_Options( $this->id );
	}

	/**
	 * Add a single item to the queue.
	 *
	 * @param object $item Event object to add to queue.
	 *
	 * @return bool|WP_Error
	 */
	public function add( $item ) {
		$added = false;

		// If empty, don't add.
		if ( empty( $item ) ) {
			return false;
		}

		// Attempt to serialize data, if an exception (closures) return early.
		try {
			$item = serialize( $item ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
		} catch ( \Exception $ex ) {
			return new WP_Error( 'queue_unable_to_serialize', 'Unable to serialize item' );
		}

		// This basically tries to add the option until enough time has elapsed that
		// it has a unique (microtime-based) option key.
		while ( ! $added ) {
			$added = $this->queue_storage->insert_item( $this->get_next_data_row_option_name(), $item );
		}

		return $added;
	}

	/**
	 * Insert all the items in a single SQL query. May be subject to query size limits!
	 *
	 * @param array $items Array of events to add to the queue.
	 *
	 * @return bool|\WP_Error
	 */
	public function add_all( $items ) {
		// TODO check and figure out if it's used at all and if we can optimize it.
		$base_option_name = $this->get_next_data_row_option_name();

		$rows_added = $this->queue_storage->add_all( $items, $base_option_name );

		if ( count( $items ) !== $rows_added ) {
			return new WP_Error( 'row_count_mismatch', "The number of rows inserted didn't match the size of the input array" );
		}

		return true;
	}

	/**
	 * Get the front-most item on the queue without checking it out.
	 *
	 * @param int $count Number of items to return when looking at the items.
	 *
	 * @return array
	 */
	public function peek( $count = 1 ) {
		$items = $this->fetch_items( $count );
		if ( $items ) {
			return Utils::get_item_values( $items );
		}

		return array();
	}

	/**
	 * Gets items with particular IDs.
	 *
	 * @param array $item_ids Array of item IDs to retrieve.
	 *
	 * @return array
	 */
	public function peek_by_id( $item_ids ) {
		$items = $this->fetch_items_by_id( $item_ids );
		if ( $items ) {
			return Utils::get_item_values( $items );
		}

		return array();
	}

	/**
	 * Gets the queue lag.
	 * Lag is the difference in time between the age of the oldest item
	 * (aka first or frontmost item) and the current time.
	 *
	 * @param float $now The current time in microtime.
	 *
	 * @return float
	 */
	public function lag( $now = null ) {
		return (float) $this->queue_storage->get_lag( $now );
	}

	/**
	 * Resets the queue.
	 */
	public function reset() {
		$this->delete_checkout_id();

		$this->queue_storage->clear_queue();
	}

	/**
	 * Return the size of the queue.
	 *
	 * @return int
	 */
	public function size() {
		return $this->queue_storage->get_item_count();
	}

	/**
	 * Lets you know if there is any items in the queue.
	 *
	 * We use this peculiar implementation because it's much faster than count(*).
	 *
	 * @return bool
	 */
	public function has_any_items() {
		return $this->size() > 0;
	}

	/**
	 * Used to checkout the queue.
	 *
	 * @param int $buffer_size Size of the buffer to checkout.
	 *
	 * @return Automattic\Jetpack\Sync\Queue_Buffer|bool|int|\WP_Error
	 */
	public function checkout( $buffer_size ) {
		if ( $this->get_checkout_id() ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		}

		// TODO check if adding a prefix is going to be a problem
		$buffer_id = uniqid( '', true );

		$result = $this->set_checkout_id( $buffer_id );

		if ( ! $result || is_wp_error( $result ) ) {
			return $result;
		}

		$items = $this->fetch_items( $buffer_size );

		if ( ! is_countable( $items ) ) {
			return false;
		}

		if ( count( $items ) === 0 ) {
			return false;
		}

		return new Queue_Buffer( $buffer_id, array_slice( $items, 0, $buffer_size ) );
	}

	/**
	 * Given a list of items return the items ids.
	 *
	 * @param array $items List of item objects.
	 *
	 * @return array Ids of the items.
	 */
	public function get_ids( $items ) {
		return array_map(
			function ( $item ) {
				return $item->id;
			},
			$items
		);
	}

	/**
	 * Pop elements from the queue.
	 *
	 * @param int $limit Number of items to pop from the queue.
	 *
	 * @return array|object|null
	 */
	public function pop( $limit ) {
		$items = $this->fetch_items( $limit );

		$ids = $this->get_ids( $items );

		$this->delete( $ids );

		return $items;
	}

	/**
	 * Get the items from the queue with a memory limit.
	 *
	 * This checks out rows until it either empties the queue or hits a certain memory limit
	 * it loads the sizes from the DB first so that it doesn't accidentally
	 * load more data into memory than it needs to.
	 * The only way it will load more items than $max_size is if a single queue item
	 * exceeds the memory limit, but in that case it will send that item by itself.
	 *
	 * @param int $max_memory (bytes) Maximum memory threshold.
	 * @param int $max_buffer_size Maximum buffer size (number of items).
	 *
	 * @return \Automattic\Jetpack\Sync\Queue_Buffer|bool|int|\WP_Error
	 */
	public function checkout_with_memory_limit( $max_memory, $max_buffer_size = 500 ) {
		if ( $this->get_checkout_id() ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		}

		$buffer_id = uniqid( '', true );

		$result = $this->set_checkout_id( $buffer_id );

		if ( ! $result || is_wp_error( $result ) ) {
			return $result;
		}

		// How much memory is currently being used by the items.
		$total_memory = 0;

		// Store the items to return
		$items = array();

		$current_items_ids = $this->queue_storage->get_items_ids_with_size( $max_buffer_size - count( $items ) );

		// If no valid items are returned or no items are returned, continue.
		if ( ! is_countable( $current_items_ids ) || count( $current_items_ids ) === 0 ) {
			return false;
		}

		$item_ids_to_fetch = array();

		foreach ( $current_items_ids as $id => $item_with_size ) {
			$total_memory += $item_with_size->value_size;

			// If this is the first item and it exceeds memory, allow loop to continue
			// we will exit on the next iteration instead.
			if ( $total_memory > $max_memory && $id > 0 ) {
				break;
			}

			$item_ids_to_fetch[] = $item_with_size->id;
		}

		$current_items = $this->queue_storage->fetch_items_by_ids( $item_ids_to_fetch );

		$items_count = is_countable( $current_items ) ? count( $current_items ) : 0;

		if ( $items_count > 0 ) {
			/**
			 * Save some memory by moving things one by one to the array of items being returned, instead of
			 * unserializing all and then merging them with other items.
			 *
			 * PHPCS ignore is because this is the expected behavior - we're assigning a variable in the condition part of the loop.
			 */
			// phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition
			while ( ( $current_item = array_shift( $current_items ) ) !== null ) {
				// @codingStandardsIgnoreStart
				$current_item->value = unserialize( $current_item->value );
				// @codingStandardsIgnoreEnd

				$items[] = $current_item;
			}
		}

		if ( count( $items ) === 0 ) {
			$this->delete_checkout_id();

			return false;
		}

		return new Queue_Buffer( $buffer_id, $items );
	}

	/**
	 * Check in the queue.
	 *
	 * @param Automattic\Jetpack\Sync\Queue_Buffer $buffer Queue_Buffer object.
	 *
	 * @return bool|\WP_Error
	 */
	public function checkin( $buffer ) {
		$is_valid = $this->validate_checkout( $buffer );

		if ( is_wp_error( $is_valid ) ) {
			return $is_valid;
		}

		$this->delete_checkout_id();

		return true;
	}

	/**
	 * Close the buffer.
	 *
	 * @param Automattic\Jetpack\Sync\Queue_Buffer $buffer Queue_Buffer object.
	 * @param null|array                           $ids_to_remove Ids to remove from the queue.
	 *
	 * @return bool|\WP_Error
	 */
	public function close( $buffer, $ids_to_remove = null ) {
		$is_valid = $this->validate_checkout( $buffer );

		if ( is_wp_error( $is_valid ) ) {
			// Always delete ids_to_remove even when buffer is no longer checked-out.
			// They were processed by WP.com so safe to remove from queue.
			if ( $ids_to_remove !== null ) {
				$this->delete( $ids_to_remove );
			}
			return $is_valid;
		}

		$this->delete_checkout_id();

		// By default clear all items in the buffer.
		if ( $ids_to_remove === null ) {
			$ids_to_remove = $buffer->get_item_ids();
		}

		$this->delete( $ids_to_remove );

		return true;
	}

	/**
	 * Delete elements from the queue.
	 *
	 * @param array $ids Ids to delete.
	 *
	 * @return bool|int
	 */
	private function delete( $ids ) {
		if ( array() === $ids ) {
			return 0;
		}

		$this->queue_storage->delete_items_by_ids( $ids );

		return true;
	}

	/**
	 * Flushes all items from the queue.
	 *
	 * @return array
	 */
	public function flush_all() {
		$items = Utils::get_item_values( $this->fetch_items() );
		$this->reset();

		return $items;
	}

	/**
	 * Get all the items from the queue.
	 *
	 * @return array|object|null
	 */
	public function get_all() {
		return $this->fetch_items();
	}

	/**
	 * Forces Checkin of the queue.
	 * Use with caution, this could allow multiple processes to delete
	 * and send from the queue at the same time
	 */
	public function force_checkin() {
		$this->delete_checkout_id();
	}

	/**
	 * Checks if the queue is locked.
	 *
	 * @return bool
	 */
	public function is_locked() {
		return (bool) $this->get_checkout_id();
	}

	/**
	 * Locks checkouts from the queue
	 * tries to wait up to $timeout seconds for the queue to be empty.
	 *
	 * @param int $timeout The wait time in seconds for the queue to be empty.
	 *
	 * @return bool|int|\WP_Error
	 */
	public function lock( $timeout = 30 ) {
		$tries = 0;

		while ( $this->has_any_items() && $tries < $timeout ) {
			sleep( 1 );
			++$tries;
		}

		if ( 30 === $tries ) {
			return new WP_Error( 'lock_timeout', 'Timeout waiting for sync queue to empty' );
		}

		if ( $this->get_checkout_id() ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		}

		// Hopefully this means we can acquire a checkout?
		$result = $this->set_checkout_id( 'lock' );

		if ( ! $result || is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Unlocks the queue.
	 *
	 * @return bool|int
	 */
	public function unlock() {
		return $this->delete_checkout_id();
	}

	/**
	 * This option is specifically chosen to, as much as possible, preserve time order
	 * and minimise the possibility of collisions between multiple processes working
	 * at the same time.
	 *
	 * @return string
	 */
	protected function generate_option_name_timestamp() {
		return sprintf( '%.6f', microtime( true ) );
	}

	/**
	 * Gets the checkout ID.
	 *
	 * @return bool|string
	 */
	private function get_checkout_id() {
		global $wpdb;
		$checkout_value = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT option_value FROM $wpdb->options WHERE option_name = %s",
				$this->get_lock_option_name()
			)
		);

		if ( $checkout_value ) {
			list( $checkout_id, $timestamp ) = explode( ':', $checkout_value );
			if ( (int) $timestamp > time() ) {
				return $checkout_id;
			}
		}

		return false;
	}

	/**
	 * Sets the checkout id.
	 *
	 * @param string $checkout_id The ID of the checkout.
	 *
	 * @return bool|int
	 */
	private function set_checkout_id( $checkout_id ) {
		global $wpdb;

		$expires     = time() + Defaults::$default_sync_queue_lock_timeout;
		$updated_num = $wpdb->query(
			$wpdb->prepare(
				"UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s",
				"$checkout_id:$expires",
				$this->get_lock_option_name()
			)
		);

		if ( ! $updated_num ) {
			$updated_num = $wpdb->query(
				$wpdb->prepare(
					"INSERT INTO $wpdb->options ( option_name, option_value, autoload ) VALUES ( %s, %s, 'no' )",
					$this->get_lock_option_name(),
					"$checkout_id:$expires"
				)
			);
		}

		return $updated_num;
	}

	/**
	 * Deletes the checkout ID.
	 *
	 * @return bool|int
	 */
	private function delete_checkout_id() {
		global $wpdb;
		// Rather than delete, which causes fragmentation, we update in place.
		return $wpdb->query(
			$wpdb->prepare(
				"UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s",
				'0:0',
				$this->get_lock_option_name()
			)
		);
	}

	/**
	 * Return the lock option name.
	 *
	 * @return string
	 */
	private function get_lock_option_name() {
		return "jpsq_{$this->id}_checkout";
	}

	/**
	 * Return the next data row option name.
	 *
	 * @return string
	 */
	private function get_next_data_row_option_name() {
		$timestamp = $this->generate_option_name_timestamp();

		// Row iterator is used to avoid collisions where we're writing data waaay fast in a single process.
		if ( PHP_INT_MAX === $this->row_iterator ) {
			$this->row_iterator = 0;
		} else {
			$this->row_iterator += 1;
		}

		return 'jpsq_' . $this->id . '-' . $timestamp . '-' . $this->random_int . '-' . $this->row_iterator;
	}

	/**
	 * Return the items in the queue.
	 *
	 * @param null|int $limit Limit to the number of items we fetch at once.
	 *
	 * @return array|object|null
	 */
	private function fetch_items( $limit = null ) {
		$items = $this->queue_storage->fetch_items( $limit );

		return $this->unserialize_values( $items );
	}

	/**
	 * Return items with specific ids.
	 *
	 * @param array $items_ids Array of event ids.
	 *
	 * @return array|object|null
	 */
	private function fetch_items_by_id( $items_ids ) {
		return $this->unserialize_values( $this->queue_storage->fetch_items_by_ids( $items_ids ) );
	}

	/**
	 * Unserialize item values.
	 *
	 * @param array $items Events from the Queue to be unserialized.
	 *
	 * @return mixed
	 */
	private function unserialize_values( $items ) {
		array_walk(
			$items,
			function ( $item ) {
				// @codingStandardsIgnoreStart
				$item->value = @unserialize( $item->value );
				// @codingStandardsIgnoreEnd
			}
		);

		return $items;
	}

	/**
	 * Return true if the buffer is still valid or an Error other wise.
	 *
	 * @param Automattic\Jetpack\Sync\Queue_Buffer $buffer The Queue_Buffer.
	 *
	 * @return bool|WP_Error
	 */
	private function validate_checkout( $buffer ) {
		if ( ! $buffer instanceof Queue_Buffer ) {
			return new WP_Error( 'not_a_buffer', 'You must checkin an instance of Automattic\\Jetpack\\Sync\\Queue_Buffer' );
		}

		$checkout_id = $this->get_checkout_id();

		if ( ! $checkout_id ) {
			return new WP_Error( 'buffer_not_checked_out', 'There are no checked out buffers' );
		}

		// TODO: change to strict comparison.
		if ( $checkout_id != $buffer->id ) { // phpcs:ignore Universal.Operators.StrictComparisons.LooseNotEqual
			return new WP_Error( 'buffer_mismatch', 'The buffer you checked in was not checked out' );
		}

		return true;
	}
}

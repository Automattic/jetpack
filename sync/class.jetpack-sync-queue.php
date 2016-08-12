<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-settings.php';

/**
 * A buffer of items from the queue that can be checked out
 */
class Jetpack_Sync_Queue_Buffer {
	public $id;
	public $items_with_ids;

	public function __construct( $id, $items_with_ids ) {
		$this->id             = $id;
		$this->items_with_ids = $items_with_ids;
	}

	public function get_items() {
		return array_combine( $this->get_item_ids(), $this->get_item_values() );
	}

	public function get_item_values() {
		return Jetpack_Sync_Utils::get_item_values( $this->items_with_ids );
	}

	public function get_item_ids() {
		return Jetpack_Sync_Utils::get_item_ids( $this->items_with_ids );
	}
}

interface Jetpack_Sync_Lock {
	public function acquire_lock( $wait = 0 );
	public function release_lock();
	public function reset();
}

class Jetpack_Sync_Lock_Transient implements Jetpack_Sync_Lock {
	private $id;

	function __construct( $id ) {
		$this->id = $id;
	}

	public function acquire_lock( $wait = 0 ) {
		if ( $this->get_lock_value() ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		}

		$result = $this->set_lock();

		if ( ! $result ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		} elseif ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	public function release_lock() {
		$checkout_id = $this->get_lock_value();

		if ( ! $checkout_id ) {
			return new WP_Error( 'buffer_not_checked_out', 'There are no checked out buffers' );
		}

		$this->delete_lock_value();

		return true;
	}

	public function reset() {
		$this->delete_lock_value();
	}

	private function get_lock_value() {
		return get_transient( $this->get_checkout_transient_name() );
	}

	private function set_lock() {
		return set_transient( $this->get_checkout_transient_name(), microtime( true ), Jetpack_Sync_Queue::QUEUE_LOCK_TIMEOUT ); // 5 minute timeout
	}

	private function delete_lock_value() {
		delete_transient( $this->get_checkout_transient_name() );
	}

	private function get_checkout_transient_name() {
		return "jpsq_{$this->id}_checkout";
	}
}

class Jetpack_Sync_Lock_MySQL {
	private $id;
	private $named_lock_name;
	static $in_memory_lock; // in-process lock

	function __construct( $id ) {
		$this->id = $id;
		global $wpdb;
		// named lock names are GLOBAL PER SERVER so should be namespaced to this particular
		// wp installation, site and queue
		$this->named_lock_name = 'jpsq_' . $wpdb->prefix . $this->id;
		if ( strlen( $this->named_lock_name ) > 64 ) {
			error_log("Warning: Named lock key is > 64 chars: '{$this->named_lock_name}'");
		}
	}

	public function acquire_lock( $wait = 0 ) {
		// use mysql to prevent cross-process concurrent access, 
		// and in-memory lock to prevent in-process concurrent access
		if ( self::$in_memory_lock && ( microtime( true ) < self::$in_memory_lock + Jetpack_Sync_Queue::QUEUE_LOCK_TIMEOUT ) ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		}

		global $wpdb;

		$acquired_lock = $wpdb->get_var( $wpdb->prepare( "SELECT GET_LOCK( %s, %d )", $this->named_lock_name, $wait ) );

		if ( $acquired_lock == 0 ) {
			return new WP_Error( 'lock_failed', 'Another process has the lock' );
		}

		// lock memory and DB
		self::$in_memory_lock = microtime( true );

		return true;
	}

	public function release_lock() {
		global $wpdb;
		$result = $wpdb->get_var( $wpdb->prepare( "SELECT RELEASE_LOCK( %s )", $this->named_lock_name ) );

		if ( $result != '1' ) {
			error_log("Warning: released lock that wasn't locked: {$this->named_lock_name}");
		}

		self::$in_memory_lock = null;

		return true;
	}

	public function reset() {
		$this->release_lock();
	}
}

/**
 * A persistent queue that can be flushed in increments of N items,
 * and which blocks reads until checked-out buffers are checked in or
 * closed. This uses raw SQL for two reasons: speed, and not triggering
 * tons of added_option callbacks.
 */
class Jetpack_Sync_Queue {
	const QUEUE_LOCK_TIMEOUT = 300; // 5 minutes
	public $id;
	private $row_iterator;
	private $lock;

	function __construct( $id ) {
		$this->id             = str_replace( '-', '_', $id ); // necessary to ensure we don't have ID collisions in the SQL
		$this->row_iterator   = 0;

		if ( (bool) Jetpack_Sync_Settings::get_setting( 'use_mysql_named_lock' ) ) {
			$this->lock = new Jetpack_Sync_Lock_MySQL( $this->id );
		} else {
			$this->lock = new Jetpack_Sync_Lock_Transient( $this->id );
		}
	}

	function add( $item ) {
		global $wpdb;
		$added = false;
		// this basically tries to add the option until enough time has elapsed that
		// it has a unique (microtime-based) option key
		while ( ! $added ) {
			$rows_added = $wpdb->query( $wpdb->prepare(
				"INSERT INTO $wpdb->options (option_name, option_value, autoload) VALUES (%s, %s,%s)",
				$this->get_next_data_row_option_name(),
				serialize( $item ),
				'no'
			) );
			$added      = ( 0 !== $rows_added );
		}

		do_action( 'jpsq_item_added' );
	}

	// Attempts to insert all the items in a single SQL query. May be subject to query size limits!
	function add_all( $items ) {
		global $wpdb;
		$base_option_name = $this->get_next_data_row_option_name();

		$query = "INSERT INTO $wpdb->options (option_name, option_value, autoload) VALUES ";

		$rows = array();

		for ( $i = 0; $i < count( $items ); $i += 1 ) {
			$option_name  = esc_sql( $base_option_name . '-' . $i );
			$option_value = esc_sql( serialize( $items[ $i ] ) );
			$rows[]       = "('$option_name', '$option_value', 'no')";
		}

		$rows_added = $wpdb->query( $query . join( ',', $rows ) );

		if ( count( $items ) === $rows_added ) {
			return new WP_Error( 'row_count_mismatch', "The number of rows inserted didn't match the size of the input array" );
		}

		do_action( 'jpsq_items_added', $rows_added );
	}

	// Peek at the front-most item on the queue without checking it out
	function peek( $count = 1 ) {
		$items = $this->fetch_items( $count );
		if ( $items ) {
			return Jetpack_Sync_Utils::get_item_values( $items );
		}

		return array();
	}

	// lag is the difference in time between the age of the oldest item
	// (aka first or frontmost item) and the current time
	function lag() {
		global $wpdb;

		$first_item_name = $wpdb->get_var( $wpdb->prepare(
			"SELECT option_name FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT 1",
			"jpsq_{$this->id}-%"
		) );

		if ( ! $first_item_name ) {
			return 0;
		}

		// break apart the item name to get the timestamp
		$matches = null;
		if ( preg_match( '/^jpsq_' . $this->id . '-(\d+\.\d+)-/', $first_item_name, $matches ) ) {
			return microtime( true ) - floatval( $matches[1] );
		} else {
			return 0;
		}
	}

	function reset() {
		global $wpdb;
		$this->lock->reset();
		$wpdb->query( $wpdb->prepare(
			"DELETE FROM $wpdb->options WHERE option_name LIKE %s", "jpsq_{$this->id}-%"
		) );
	}

	function size() {
		global $wpdb;

		return (int) $wpdb->get_var( $wpdb->prepare(
			"SELECT count(*) FROM $wpdb->options WHERE option_name LIKE %s", "jpsq_{$this->id}-%"
		) );
	}

	// we use this peculiar implementation because it's much faster than count(*)
	function has_any_items() {
		global $wpdb;
		$value = $wpdb->get_var( $wpdb->prepare(
			"SELECT exists( SELECT option_name FROM $wpdb->options WHERE option_name LIKE %s )", "jpsq_{$this->id}-%"
		) );

		return ( $value === '1' );
	}

	function checkout( $buffer_size ) {
		$buffer_id = uniqid();

		$lock_result = $this->acquire_lock( $buffer_id );

		if ( is_wp_error( $lock_result ) ) {
			return $lock_result;
		}

		$items = $this->fetch_items( $buffer_size );

		if ( count( $items ) === 0 ) {
			return false;
		}

		$buffer = new Jetpack_Sync_Queue_Buffer( $buffer_id, array_slice( $items, 0, $buffer_size ) );

		return $buffer;
	}

	// this checks out rows until it either empties the queue or hits a certain memory limit
	// it loads the sizes from the DB first so that it doesn't accidentally
	// load more data into memory than it needs to.
	// The only way it will load more items than $max_size is if a single queue item
	// exceeds the memory limit, but in that case it will send that item by itself.
	function checkout_with_memory_limit( $max_memory, $max_buffer_size = 500 ) {
		$lock_result = $this->acquire_lock();
		
		if ( is_wp_error( $lock_result ) ) {
			return $lock_result;
		}

		// get the map of buffer_id -> memory_size
		global $wpdb;

		$items_with_size = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT option_name AS id, LENGTH(option_value) AS value_size FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT %d",
				"jpsq_{$this->id}-%",
				$max_buffer_size
			),
			OBJECT
		);

		$total_memory = 0;
		$item_ids     = array();

		foreach ( $items_with_size as $item_with_size ) {
			$total_memory += $item_with_size->value_size;

			// if this is the first item and it exceeds memory, allow loop to continue
			// we will exit on the next iteration instead
			if ( $total_memory > $max_memory && count( $item_ids ) > 0 ) {
				break;
			}
			$item_ids[] = $item_with_size->id;
		}

		$items = $this->fetch_items_by_id( $item_ids );

		if ( count( $items ) === 0 ) {
			$this->release_lock();
			return false;
		}

		$buffer = new Jetpack_Sync_Queue_Buffer( uniqid(), $items );

		return $buffer;
	}

	function checkin( $buffer ) {
		return $this->release_lock();
	}

	function close( $buffer, $ids_to_remove = null ) {
		$released = $this->release_lock();

		if ( is_wp_error( $released ) ) {
			return $released;
		}

		// by default clear all items in the buffer
		if ( is_null( $ids_to_remove ) ) {
			$ids_to_remove = $buffer->get_item_ids();
		}

		global $wpdb;

		if ( count( $ids_to_remove ) > 0 ) {
			$sql   = "DELETE FROM $wpdb->options WHERE option_name IN (" . implode( ', ', array_fill( 0, count( $ids_to_remove ), '%s' ) ) . ')';
			$query = call_user_func_array( array( $wpdb, 'prepare' ), array_merge( array( $sql ), $ids_to_remove ) );
			$wpdb->query( $query );
		}

		return true;
	}

	function flush_all() {
		$items = Jetpack_Sync_Utils::get_item_values( $this->fetch_items() );
		$this->reset();

		return $items;
	}

	function get_all() {
		return $this->fetch_items();
	}

	// use with caution, this could allow multiple processes to delete
	// and send from the queue at the same time
	function force_checkin() {
		$this->release_lock();
	}

	// used to lock checkouts from the queue.
	// tries to wait up to $timeout seconds for the queue to be empty
	function lock( $timeout = 30 ) {
		$tries = 0;

		while ( $this->has_any_items() && $tries < $timeout ) {
			sleep( 1 );
			$tries += 1;
		}

		if ( $tries === 30 ) {
			return new WP_Error( 'lock_timeout', 'Timeout waiting for sync queue to empty' );
		}

		return $this->acquire_lock();
	}

	function unlock() {
		$this->release_lock();
	}

	private function acquire_lock() {
		return $this->lock->acquire_lock();
	}

	private function release_lock() {
		return $this->lock->release_lock();
	}

	private function get_next_data_row_option_name() {
		// this option is specifically chosen to, as much as possible, preserve time order
		// and minimise the possibility of collisions between multiple processes working
		// at the same time
		// TODO: confirm we only need to support PHP 5.05+ (otherwise we'll need to emulate microtime as float, and avoid PHP_INT_MAX)
		// @see: http://php.net/manual/en/function.microtime.php
		$timestamp = sprintf( '%.6f', microtime( true ) );

		// row iterator is used to avoid collisions where we're writing data waaay fast in a single process
		if ( $this->row_iterator === PHP_INT_MAX ) {
			$this->row_iterator = 0;
		} else {
			$this->row_iterator += 1;
		}

		return 'jpsq_' . $this->id . '-' . $timestamp . '-' . getmypid() . '-' . $this->row_iterator;
	}

	private function fetch_items( $limit = null ) {
		global $wpdb;

		if ( $limit ) {
			$query_sql = $wpdb->prepare( "SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT %d", "jpsq_{$this->id}-%", $limit );
		} else {
			$query_sql = $wpdb->prepare( "SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC", "jpsq_{$this->id}-%" );
		}

		$items = $wpdb->get_results( $query_sql, OBJECT );
		foreach ( $items as $item ) {
			$item->value = maybe_unserialize( $item->value );
		}

		return $items;
	}

	private function fetch_items_by_id( $item_ids ) {
		global $wpdb;

		if ( count( $item_ids ) > 0 ) {
			$sql   = "SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name IN (" . implode( ', ', array_fill( 0, count( $item_ids ), '%s' ) ) . ') ORDER BY option_name ASC';
			$query = call_user_func_array( array( $wpdb, 'prepare' ), array_merge( array( $sql ), $item_ids ) );
			$items = $wpdb->get_results( $query, OBJECT );
			foreach ( $items as $item ) {
				$item->value = maybe_unserialize( $item->value );
			}

			return $items;
		} else {
			return array();
		}
	}
}

class Jetpack_Sync_Utils {

	static function get_item_values( $items ) {
		return array_map( array( __CLASS__, 'get_item_value' ), $items );
	}

	static function get_item_ids( $items ) {
		return array_map( array( __CLASS__, 'get_item_id' ), $items );
	}

	static private function get_item_value( $item ) {
		return $item->value;
	}

	static private function get_item_id( $item ) {
		return $item->id;
	}
}

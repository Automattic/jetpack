<?php

/**
 * A buffer of items from the queue that can be checked out
 */
class Jetpack_Sync_Queue_Buffer {
	public $id;
	public $items_with_ids;

	public function __construct( $items_with_ids ) {
		$this->id             = uniqid();
		$this->items_with_ids = $items_with_ids;
	}

	public function get_items() {
		return Jetpack_Sync_Utils::get_item_values( $this->items_with_ids );
	}

	public function get_item_ids() {
		return Jetpack_Sync_Utils::get_item_ids( $this->items_with_ids );
	}
}

/**
 * A persistent queue that can be flushed in increments of N items,
 * and which blocks reads until checked-out buffers are checked in or
 * closed. This uses raw SQL for two reasons: speed, and not triggering
 * tons of added_option callbacks.
 */
class Jetpack_Sync_Queue {
	public $id;
	private $checkout_size;
	private $row_iterator;

	function __construct( $id, $checkout_size = 10 ) {
		$this->id            = str_replace( '-', '_', $id ); // necessary to ensure we don't have ID collisions in the SQL
		$this->checkout_size = $checkout_size;
		$this->row_iterator  = 0;
	}

	function add( $item ) {
		global $wpdb;
		$added = false;
		// this basically tries to add the option until enough time has elapsed that
		// it has a unique (microtime-based) option key
		while ( ! $added ) {
			$rows_added = $wpdb->query( $wpdb->prepare(
				"INSERT INTO $wpdb->options (option_name, option_value,autoload) VALUES (%s, %s,%s)",
				$this->get_next_data_row_option_name(),
				serialize( $item ),
				'no'
			) );
			$added      = ( $rows_added !== 0 );
		}
	}

	// Attempts to insert all the items in a single SQL query. May be subject to query size limits!
	function add_all( $items ) {
		global $wpdb;
		$base_option_name = $this->get_next_data_row_option_name();

		$query = "INSERT INTO $wpdb->options (option_name, option_value,autoload) VALUES ";

		$rows = array();

		for ( $i = 0; $i < count( $items ); $i += 1 ) {
			$option_name  = esc_sql( $base_option_name . '-' . $i );
			$option_value = esc_sql( serialize( $items[ $i ] ) );
			$rows[]       = "('$option_name', '$option_value', 'no')";
		}

		$rows_added = $wpdb->query( $query . join( ',', $rows ) );

		if ( $rows_added !== count( $items ) ) {
			return new WP_Error( 'row_count_mismatch', "The number of rows inserted didn't match the size of the input array" );
		}
	}

	// Peek at the front-most item on the queue without checking it out
	function peek( $count = 1 ) {
		$items = $this->fetch_items( $count );
		if ( $items ) {
			return Jetpack_Sync_Utils::get_item_values( $items );
		}

		return array();
	}

	// lag is the difference in time between the age of the oldest item and the current time
	function lag() {
		global $wpdb;

		$last_item_name = $wpdb->get_var( $wpdb->prepare( 
			"SELECT option_name FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT 1",
			"jpsq_{$this->id}-%"
		) );

		if ( ! $last_item_name ) {
			return null;
		}

		// break apart the item name to get the timestamp
		$matches = null;
		if ( preg_match( '/^jpsq_'.$this->id.'-(\d+\.\d+)-/', $last_item_name, $matches ) ) {
			return microtime(true) - floatval($matches[1]);	
		} else {
			return null;
		}		
	}

	function reset() {
		global $wpdb;
		$this->delete_checkout_id();
		$wpdb->query( $wpdb->prepare(
			"DELETE FROM $wpdb->options WHERE option_name LIKE %s", "jpsq_{$this->id}-%"
		) );
	}

	function size() {
		global $wpdb;

		return $wpdb->get_var( $wpdb->prepare(
			"SELECT count(*) FROM $wpdb->options WHERE option_name LIKE %s", "jpsq_{$this->id}-%"
		) );
	}

	// we use this peculiar implementation because it's much faster than count(*)
	function has_any_items() {
		global $wpdb;
		$value = $wpdb->get_var( $wpdb->prepare(
			"SELECT exists( SELECT option_name FROM $wpdb->options WHERE option_name LIKE %s )", "jpsq_{$this->id}-%"
		) );

		return ( $value === "1" );
	}

	function checkout() {
		if ( $this->get_checkout_id() ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		}

		$items = $this->fetch_items( $this->checkout_size );

		if ( count( $items ) === 0 ) {
			return false;
		}

		$buffer = new Jetpack_Sync_Queue_Buffer( array_slice( $items, 0, $this->checkout_size ) );

		$result = $this->set_checkout_id( $buffer->id );

		if ( ! $result || is_wp_error( $result ) ) {
			error_log( "badness setting checkout ID (this should not happen)" );

			return $result;
		}

		return $buffer;
	}

	function checkin( $buffer ) {
		$is_valid = $this->validate_checkout( $buffer );

		if ( is_wp_error( $is_valid ) ) {
			return $is_valid;
		}

		$this->delete_checkout_id();

		return true;
	}

	function close( $buffer ) {
		$is_valid = $this->validate_checkout( $buffer );

		if ( is_wp_error( $is_valid ) ) {
			return $is_valid;
		}

		$this->delete_checkout_id();

		global $wpdb;

		// all this fanciness is basically so we can prepare a statement with an IN(id1, id2, id3) clause
		$ids_to_remove = $buffer->get_item_ids();
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

	function set_checkout_size( $new_size ) {
		$this->checkout_size = $new_size;
	}

	private function get_checkout_id() {
		return get_option( $this->get_checkout_option_name(), false );
	}

	private function set_checkout_id( $checkout_id ) {
		$added = add_option( $this->get_checkout_option_name(), $checkout_id, null, true ); // this one we should autoload
		if ( ! $added ) {
			return new WP_Error( 'buffer_mismatch', 'Another buffer is already checked out: ' . $this->get_checkout_id() );
		} else {
			return true;
		}
	}

	private function delete_checkout_id() {
		delete_option( $this->get_checkout_option_name() );
	}

	private function get_checkout_option_name() {
		return "jpsq_{$this->id}_checkout";
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

		$items = $wpdb->get_results( $query_sql );
		foreach ( $items as $item ) {
			$item->value = maybe_unserialize( $item->value );
		}

		return $items;
	}

	private function validate_checkout( $buffer ) {
		if ( ! $buffer instanceof Jetpack_Sync_Queue_Buffer ) {
			return new WP_Error( 'not_a_buffer', 'You must checkin an instance of Jetpack_Sync_Queue_Buffer' );
		}

		$checkout_id = $this->get_checkout_id();

		if ( ! $checkout_id ) {
			return new WP_Error( 'buffer_not_checked_out', 'There are no checked out buffers' );
		}

		if ( $checkout_id != $buffer->id ) {
			return new WP_Error( 'buffer_mismatch', 'The buffer you checked in was not checked out' );
		}

		return true;
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

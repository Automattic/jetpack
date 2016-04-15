<?php

/** 
 * A buffer of items from the queue that can be checked out
 */
class Jetpack_Sync_Queue_Buffer {
	public $id;
	public $items_with_ids;
	
	public function __construct( $items_with_ids ) {
		$this->id = uniqid();
		$this->items_with_ids = $items_with_ids;
	}

	public function get_items() {
		return array_map( function( $item ) { return $item->value; }, $this->items_with_ids );
	}

	public function get_item_ids() {
		return array_map( function( $item ) { return $item->id; }, $this->items_with_ids );
	}
}

/**
 * A persistent queue that can be flushed in increments of N items,
 * and which blocks reads until checked-out buffers are checked in or
 * closed
 */
class Jetpack_Sync_Queue {
	public $id;
	private $checkout_size;

	function __construct( $id, $checkout_size = 10 ) {
		$this->id = str_replace( '-', '_', $id); // necessary to ensure we don't have ID collisions in the SQL
		$this->checkout_size = $checkout_size;
	}

	function add( $item ) {
		$added = false;
		// this basically tries to add the option until enough time has elapsed that
		// it has a unique (microtime-based) option key
		while(!$added) {
			$added = add_option( $this->get_option_name(), $item, null, false );	
		}
	}

	function add_all( $items ) {
		// TODO: perhaps there's a more efficient version of this?
		foreach( $items as $item ) {
			$this->add( $item );
		}
	}

	function size() {
		global $wpdb;
		return $wpdb->get_var( $wpdb->prepare( 
			"SELECT count(*) FROM $wpdb->options WHERE option_name LIKE %s", "jetpack_sync_queue_{$this->id}-%" 
		) );
	}

	function checkout() {
		if ( $this->get_checkout_id() ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		}
		$items = $this->fetch_items( $this->checkout_size );
		$buffer = new Jetpack_Sync_Queue_Buffer( array_slice( $items, 0, $this->checkout_size ) );
		$this->set_checkout_id( $buffer->id );
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
			$sql = "DELETE FROM $wpdb->options WHERE option_name IN (".implode(', ', array_fill(0, count($ids_to_remove), '%s')).')';
			$query = call_user_func_array( array( $wpdb, 'prepare' ), array_merge( array( $sql ), $ids_to_remove ) );
			$wpdb->query( $query );
		}

		return true;
	}

	function flush_all() {
		global $wpdb;
		$items = array_map( function( $item ) { return $item->value; }, $this->fetch_items() );
		$wpdb->query( $wpdb->prepare( 
			"DELETE FROM $wpdb->options WHERE option_name LIKE %s", "jetpack_sync_queue_{$this->id}-%" 
		) );
		return $items;
	}

	function set_checkout_size( $new_size ) {
		$this->checkout_size = $new_size;
	}

	private function get_checkout_id() {
		return get_option( "jetpack_sync_queue_{$this->id}-checkout", false );
	}

	private function set_checkout_id( $checkout_id ) {
		return add_option( "jetpack_sync_queue_{$this->id}-checkout", $checkout_id, null, true ); // this one we should autoload
	}

	private function delete_checkout_id() {
		delete_option( "jetpack_sync_queue_{$this->id}-checkout" );
	}

	private function get_option_name() {
		// this option is specifically chosen to, as much as possible, preserve time order
		// and minimise the possibility of collisions between multiple processes working 
		// at the same time
		// TODO: confirm we only need to support PHP5 (otherwise we'll need to emulate microtime as float)
		// @see: http://php.net/manual/en/function.microtime.php
		$timestamp = sprintf( '%.5f', microtime(true) );
		return 'jetpack_sync_queue_'.$this->id.'-'.$timestamp.'-'.getmypid();
	}

	private function fetch_items( $limit = null ) {
		global $wpdb;

		if ( $limit ) {
			$query_sql = $wpdb->prepare( "SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC LIMIT %d", "jetpack_sync_queue_{$this->id}-%", $limit );
		} else {
			$query_sql = $wpdb->prepare( "SELECT option_name AS id, option_value AS value FROM $wpdb->options WHERE option_name LIKE %s ORDER BY option_name ASC", "jetpack_sync_queue_{$this->id}-%" );
		}

		$items = $wpdb->get_results( $query_sql );
		foreach( $items as $item ) {
			$item->value = maybe_unserialize( $item->value );
		} 

		return $items;
	}

	private function validate_checkout( $buffer ) {
		if ( ! $buffer instanceof Jetpack_Sync_Queue_Buffer ) {
			return new WP_Error( 'not_a_buffer', 'You must checkin an instance of Jetpack_Sync_Queue_Buffer' );
		}

		$checkout_id = $this->get_checkout_id();

		if ( !$checkout_id ) {
			return new WP_Error( 'buffer_not_checked_out', 'There are no checked out buffers' );
		}

		if ( $checkout_id != $buffer->id ) {
			return new WP_Error( 'buffer_mismatch', 'The buffer you checked in was not checked out' );
		}

		return true;
	}
}
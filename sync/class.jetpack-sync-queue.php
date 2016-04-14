<?php

/** 
 * A buffer of items from the queue that can be checked out
 */
class Jetpack_Sync_Queue_Buffer {
	public $items;
	public $id;
	public function __construct( $items ) {
		$this->id = uniqid();
		$this->items = $items;
	}
}

/**
 * A persistent queue that can be flushed in increments of N items,
 * and which blocks reads until checked-out buffers are checked in or
 * closed
 */
class Jetpack_Sync_Queue {
	public $id;
	private $items = array();
	private $checkout = null;
	private $checkout_size = 10;

	function __construct( $id ) {
		$this->id = $id;
	}

	function add( $item ) {
		$this->items[] = $item;
	}

	function add_all( $items ) {
		$this->items += $items;
	}

	function size() {
		return count( $this->items );
	}

	function checkout() {
		if ( $this->checkout ) {
			return new WP_Error( 'unclosed_buffer', 'There is an unclosed buffer' );
		}
		$buffer = new Jetpack_Sync_Queue_Buffer( array_slice( $this->items, 0, $this->checkout_size ) );
		$this->checkout = $buffer;
		return $buffer;
	}

	function checkin( $buffer ) {
		$is_valid = $this->validate_checkout( $buffer );

		if ( is_wp_error( $is_valid ) ) {
			return $is_valid;
		}

		$this->checkout = null;

		return true;
	}

	function close( $buffer ) {
		$is_valid = $this->validate_checkout( $buffer );

		if ( is_wp_error( $is_valid ) ) {
			return $is_valid;
		}

		$this->checkout = null;

		$this->items = array_slice( $this->items, count( $buffer->items ) );

		return true;
	}

	function flush_all() {
		$items_reference = $this->items;
		$this->items = array();
		return $items_reference;
	}

	function set_checkout_size( $new_size ) {
		$this->checkout_size = $new_size;
	}

	private function validate_checkout( $buffer ) {
		if ( ! $buffer instanceof Jetpack_Sync_Queue_Buffer ) {
			return new WP_Error( 'not_a_buffer', 'You must checkin an instance of Jetpack_Sync_Queue_Buffer' );
		}

		if ( !$this->checkout ) {
			return new WP_Error( 'buffer_not_checked_out', 'There are no checked out buffers' );
		}

		if ( $this->checkout->id != $buffer->id ) {
			return new WP_Error( 'buffer_mismatch', 'The buffer you checked in was not checked out' );
		}

		return true;
	}
}
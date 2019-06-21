<?php

namespace Automattic\Jetpack\Sync;

/**
 * A buffer of items from the queue that can be checked out
 */
class Queue_Buffer {
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
		return Utils::get_item_values( $this->items_with_ids );
	}

	public function get_item_ids() {
		return Utils::get_item_ids( $this->items_with_ids );
	}
}

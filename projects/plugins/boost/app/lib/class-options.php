<?php

namespace Automattic\Jetpack_Boost\Lib;

class Options {

	private $key;

	public function __construct( $key ) {
		$this->key = $key;
	}

	public function get() {
		return get_option( $this->key, array() );
	}

	public function append( $item ) {
		$all_items = get_option( $this->key, array() );

		if ( ! in_array( $item, $all_items, true ) ) {
			$all_items[] = $item;
			update_option( $this->key, $all_items );
		}
	}

	public function delete() {
		delete_option( $this->key );
	}
}

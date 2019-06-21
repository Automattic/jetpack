<?php

namespace Automattic\Jetpack\Sync;

class Utils {

	static function get_item_values( $items ) {
		return array_map( array( __CLASS__, 'get_item_value' ), $items );
	}

	static function get_item_ids( $items ) {
		return array_map( array( __CLASS__, 'get_item_id' ), $items );
	}

	private static function get_item_value( $item ) {
		return $item->value;
	}

	private static function get_item_id( $item ) {
		return $item->id;
	}
}

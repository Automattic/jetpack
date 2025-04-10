<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;

class Mergeable_Array_Entry implements Entry_Can_Get, Entry_Can_Merge {
	private $option_key;

	public function __construct( $option_key ) {
		$this->option_key = $option_key;
	}

	public function get( $fallback_value = false ) {
		// WordPress looks at argument count to figure out if a fallback value was used.
		// Only provide the fallback value if it's not the default ( false ).
		if ( $fallback_value !== false ) {
			return get_option( $this->option_key, $fallback_value );
		}
		return get_option( $this->option_key );
	}

	public function set( $value ) {
		update_option( $this->option_key, $value, false );
	}

	public function merge( $value, $partial_value ) {
		return array_merge( $value, $partial_value );
	}
}

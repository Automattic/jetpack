<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;

class Foundation_Pages_Entry implements Entry_Can_Get, Entry_Can_Set {

	private $option_key;

	public function __construct( $option_key ) {
		$this->option_key = 'jetpack_boost_ds_' . $option_key;
	}

	public function get( $fallback_value = false ) {
		if ( $fallback_value !== false ) {
			return get_option( $this->option_key, $fallback_value );
		}

		return get_option( $this->option_key );
	}
	public function set( $value ) {
		$value = $this->sanitize_value( $value );

		update_option( $this->option_key, $value );
	}
	private function sanitize_value( $value ) {
		if ( is_array( $value ) ) {
			$value = array_values( array_unique( array_filter( array_map( 'trim', $value ) ) ) );
		} else {
			$value = array();
		}

		return $value;
	}
}

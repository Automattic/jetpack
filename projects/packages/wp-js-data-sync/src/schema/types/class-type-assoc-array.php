<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

class Type_Assoc_Array implements Schema_Type {
	private $sub_schema;

	public function __construct( $sub_schema ) {
		$this->sub_schema = $sub_schema;
	}

	public function parse( $data ) {
		if ( ! is_array( $data ) || $this->is_sequential_array( $data ) ) {
			$message = "Expected an associative array, received '" . gettype( $data ) . "'";
			throw new \Error( $message );
		}

		$parsed = array();
		foreach ( $this->sub_schema as $key => $validator ) {
			if ( ! isset( $data[ $key ] ) ) {
				$message = "Expected key '$key' in associative array";
				throw new \Error( $message );
			}
			$parsed[ $key ] = $validator->parse( $data[ $key ] );
		}

		return $parsed;
	}

	private function is_sequential_array( $arr ) {
		if ( array() === $arr ) {
			return false;
		}
		return array_keys( $arr ) === range( 0, count( $arr ) - 1 );
	}
}



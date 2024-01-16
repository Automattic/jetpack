<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Any_JSON implements Parser {
	public function parse( $value, $_meta = null ) {

		if ( ! is_array( $value ) ) {
			$message = 'JSON Data must be an array';
			throw new Schema_Internal_Error( $message, $value );
		}
		// Attempt to encode the JSON data and throw errors if it fails
		if ( false === wp_json_encode( $value ) ) {
			$message = 'JSON Data must be valid JSON';
			throw new Schema_Internal_Error( $message, $value );
		}

		return $value;
	}

	public function __toString() {
		return '"any_json"';
	}

	public function jsonSerialize() {
		return $this->__toString();
	}
}

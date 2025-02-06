<?php

namespace Automattic\Jetpack\Schema\Types;

use Automattic\Jetpack\Schema\Parser;
use Automattic\Jetpack\Schema\Schema_Error;

class Type_Any_JSON implements Parser {
	public function parse( $value, $_context ) {

		if ( ! is_array( $value ) ) {
			$message = 'JSON Data must be an array';
			throw new Schema_Error( $message, $value );
		}
		// Attempt to encode the JSON data and throw errors if it fails
		if ( false === wp_json_encode( $value ) ) {
			$message = 'JSON Data must be valid JSON';
			throw new Schema_Error( $message, $value );
		}

		return $value;
	}

	public function __toString() {
		return 'any_json';
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}
	public function schema() {
		return array(
			'type' => (string) $this,
		);
	}
}

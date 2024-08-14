<?php

namespace Automattic\Jetpack\Schema\Types;

use Automattic\Jetpack\Schema\Parser;
use Automattic\Jetpack\Schema\Schema_Error;

class Type_Boolean implements Parser {
	public function parse( $value, $_context ) {
		if ( is_bool( $value ) ) {
			return $value;
		}

		$loose_values = array(
			// Numbers used as booleans
			'1',
			'0',
			1,
			0,
			// WordPress can return empty string for false.
			'',
		);
		if ( ! in_array( $value, $loose_values, true ) ) {
			throw new Schema_Error( 'Invalid boolean value', $value );
		}
		return filter_var( $value, FILTER_VALIDATE_BOOLEAN );
	}

	public function __toString() {
		return 'boolean';
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

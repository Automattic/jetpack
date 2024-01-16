<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Boolean implements Parser {
	public function parse( $value, $_meta = null ) {
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
			throw new Schema_Internal_Error( 'Invalid boolean value', $value );
		}
		return filter_var( $value, FILTER_VALIDATE_BOOLEAN );
	}

	public function __toString() {
		return 'boolean';
	}

	public function jsonSerialize() {
		return "\"{$this->__toString()}\"";
	}
}

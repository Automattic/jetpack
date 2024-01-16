<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Float implements Parser {
	public function parse( $value, $_meta = null ) {
		if ( ! is_numeric( $value ) ) {
			throw new Schema_Internal_Error( 'Invalid number', $value );
		}
		return (float) $value;
	}
	public function __toString() {
		return '"float"';
	}

	public function jsonSerialize() {
		return $this->__toString();
	}
}

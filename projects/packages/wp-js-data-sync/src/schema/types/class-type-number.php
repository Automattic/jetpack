<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Number implements Parser {

	public function parse( $value, $_meta = null ) {
		if ( ! is_numeric( $value ) ) {
			throw new Schema_Internal_Error( 'Invalid number', $value );
		}
		return (int) $value;
	}
	public function __toString() {
		return 'number';
	}
	public function jsonSerialize() {
		return "\"{$this->__toString()}\"";
	}
}

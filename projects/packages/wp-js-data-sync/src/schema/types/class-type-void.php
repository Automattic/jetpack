<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

/**
 * This schema represents no data whatsoever. It will always return null.
 */
class Type_Void implements Parser {

	public function parse( $value, $_meta = null ) {
		if ( ! empty( $value ) ) {
			throw new Schema_Internal_Error( 'Void type cannot have any data.', $value );
		}
		return null;
	}
	public function __toString() {
		return 'void';
	}

	public function jsonSerialize() {
		return "\"{$this->__toString()}\"";
	}
}

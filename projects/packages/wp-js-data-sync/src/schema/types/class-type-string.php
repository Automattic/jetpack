<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;

class Type_String implements Parser {

	public function parse( $value, $_context ) {

		if ( ! is_scalar( $value ) || null === $value ) {
			throw new Schema_Error( 'Expected a string, received ' . gettype( $value ), $value );
		}

		return (string) $value;
	}

	public function __toString() {
		return 'string';
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

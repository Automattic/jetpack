<?php

namespace Automattic\Jetpack\Schema\Types;

use Automattic\Jetpack\Schema\Parser;
use Automattic\Jetpack\Schema\Schema_Error;

class Type_Number implements Parser {

	public function parse( $value, $_context ) {
		if ( ! is_numeric( $value ) ) {
			throw new Schema_Error( 'Invalid number', $value );
		}
		return (int) $value;
	}
	public function __toString() {
		return 'number';
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

<?php

namespace Automattic\Jetpack\Schema\Types;

use Automattic\Jetpack\Schema\Parser;
use Automattic\Jetpack\Schema\Schema_Error;
use Automattic\Jetpack\Schema\Utils;

/**
 * This schema represents no data whatsoever. It will always return null.
 */
class Type_Void implements Parser {

	public function parse( $value, $_context ) {
		if ( ! empty( $value ) && Utils::is_debug() ) {
			throw new Schema_Error( 'Void type cannot have any data.', $value );
		}
		return null;
	}
	public function __toString() {
		return 'void';
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

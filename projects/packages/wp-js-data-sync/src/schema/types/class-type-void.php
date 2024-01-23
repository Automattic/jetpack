<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\DS_Utils;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;

/**
 * This schema represents no data whatsoever. It will always return null.
 */
class Type_Void implements Parser {

	public function parse( $value, $_context ) {
		if ( ! empty( $value ) && DS_Utils::is_debug() ) {
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

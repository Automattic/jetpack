<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Boolean implements Parser {
	public function parse( $data, $_meta = null ) {
		if ( is_bool( $data ) ) {
			return $data;
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
		if ( ! in_array( $data, $loose_values, true ) ) {
			throw new Schema_Internal_Error( 'Invalid boolean value', $data );
		}
		return filter_var( $data, FILTER_VALIDATE_BOOLEAN );
	}
}

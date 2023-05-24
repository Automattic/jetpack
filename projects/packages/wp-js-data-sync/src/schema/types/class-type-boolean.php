<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

class Type_Boolean implements Parser {
	public function parse( $input_value ) {
		if ( is_bool( $input_value ) ) {
			return $input_value;
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
		if ( ! in_array( $input_value, $loose_values, true ) ) {
			throw new \Error( 'Invalid boolean value' );
		}
		return filter_var( $input_value, FILTER_VALIDATE_BOOLEAN );
	}

}

<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Float implements Parser {
	public function parse( $data, $_meta = null ) {
		if ( ! is_numeric( $data ) ) {
			throw new Schema_Internal_Error( 'Invalid number', $data );
		}
		return (float) $data;
	}
}

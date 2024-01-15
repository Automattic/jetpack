<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Error;

class Type_Number implements Parser {

	public function parse( $data, $meta ) {
		if ( ! is_numeric( $data ) ) {
			throw new Schema_Validation_Error( 'Invalid number', $data, $meta );
		}
		return (int) $data;
	}
}

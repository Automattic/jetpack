<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Any_JSON implements Parser {
	public function parse( $data, $_meta = null ) {

		if ( ! is_array( $data ) ) {
			$message = 'JSON Data must be an array';
			throw new Schema_Internal_Error( $message, $data );
		}
		// Attempt to encode the JSON data and throw errors if it fails
		if ( false === wp_json_encode( $data ) ) {
			$message = 'JSON Data must be valid JSON';
			throw new Schema_Internal_Error( $message, $data );
		}

		return $data;
	}
}

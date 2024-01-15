<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Error;

class Type_Any_JSON implements Parser {
	public function parse( $json_data, $meta ) {

		if ( ! is_array( $json_data ) ) {
			$message = 'JSON Data must be an array';
			throw new Schema_Validation_Error( $message, $json_data );
		}
		// Attempt to encode the JSON data and throw errors if it fails
		if ( false === wp_json_encode( $json_data ) ) {
			$message = 'JSON Data must be valid JSON';
			throw new Schema_Validation_Error( $message, $json_data );
		}

		return $json_data;
	}
}

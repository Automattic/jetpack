<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

class Type_Any_JSON implements Schema_Type {
	public function parse( $json_data ) {

		if ( ! is_array( $json_data ) ) {
			$message = 'JSON Data must be an array';
			throw new \Error( $message );
		}
		// Attempt to encode the JSON data and throw errors if it fails
		if ( false === wp_json_encode( $json_data ) ) {
			$message = 'JSON Data must be valid JSON';
			throw new \Error( $message );
		}

		return $json_data;
	}
}

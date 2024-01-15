<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Error;

class Type_String implements Parser {

	public function parse( $data, $_meta = null ) {

		if ( ! is_scalar( $data ) || null === $data ) {
			throw new Schema_Validation_Error( 'Expected a string, received ' . gettype( $data ), $data );
		}

		return (string) $data;
	}
}

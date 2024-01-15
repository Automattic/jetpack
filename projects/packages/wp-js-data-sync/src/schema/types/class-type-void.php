<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Error;

/**
 * This schema represents no data whatsoever. It will always return null.
 */
class Type_Void implements Parser {

	public function parse( $data, $meta ) {
		if ( ! empty( $data ) ) {
			throw new Schema_Validation_Error( 'Void type cannot have any data.', $data, $meta );
		}
		return null;
	}
}

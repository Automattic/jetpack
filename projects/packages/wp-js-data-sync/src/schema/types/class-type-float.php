<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

class Type_Float implements Parser {
	public function parse( $data ) {
		if ( ! is_numeric( $data ) ) {
			throw new \Error( 'Invalid number' );
		}
		return (float) $data;
	}
}

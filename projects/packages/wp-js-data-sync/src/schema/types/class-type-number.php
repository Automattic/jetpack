<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

class Type_Number implements Parser {

	public function parse( $data ) {
		if ( ! is_numeric( $data ) ) {
			throw new \RuntimeException( 'Invalid number' );
		}
		return (int) $data;
	}
}

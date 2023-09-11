<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

class Type_String implements Parser {

	public function parse( $data ) {

		if ( ! is_scalar( $data ) || null === $data ) {
			throw new \Error( 'Expected a string, received ' . gettype( $data ) );
		}

		return (string) $data;
	}
}

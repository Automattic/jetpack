<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

class Type_String implements Schema_Type {

	public function parse( $data ) {

		if ( ! is_scalar( $data ) || null === $data ) {
			throw new \Error( 'Expected a string, received ' . gettype( $data ) );
		}

		return (string) $data;
	}
}

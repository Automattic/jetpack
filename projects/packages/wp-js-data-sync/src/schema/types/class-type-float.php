<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

class Type_Float implements Schema_Type {
	public function parse( $data ) {
		if ( ! is_numeric( $data ) ) {
			throw new \Error( 'Invalid number' );
		}
		return (float) $data;
	}
}

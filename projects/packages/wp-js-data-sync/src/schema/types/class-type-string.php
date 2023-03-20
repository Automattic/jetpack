<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Type;

class Type_String implements Validation_Type {
	public function validate($data) {
		return is_string( $data );
	}

	public function sanitize($data) {
		return is_string($data) ? $data : '';
	}
}

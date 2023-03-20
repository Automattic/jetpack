<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Type;

class Type_Float implements Validation_Type {
	public function validate($array) {
		return is_numeric( $array);
	}

	public function sanitize($data) {
		return is_numeric($data) ? (float) $data : 0;
	}
}

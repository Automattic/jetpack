<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Type;

class Type_Boolean implements Validation_Type {
	public function validate($array) {
		return is_bool($array);
	}

	public function sanitize($data) {
		return (bool) $data;
	}
}

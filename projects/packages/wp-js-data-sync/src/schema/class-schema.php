<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Shape;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Enum;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Number;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_String;

class Schema {
	public static function as_string() {
		return new Validation_Rule(new Type_String());
	}

	public function as_shape( $shape = null ) {
		return new Validation_Rule(new Type_Shape( $shape));
	}

	public static function as_number() {
		return new Validation_Rule(new Type_Number());
	}

	public static function enum($allowedValues) {
		return new Validation_Rule(new Type_Enum($allowedValues));
	}
}

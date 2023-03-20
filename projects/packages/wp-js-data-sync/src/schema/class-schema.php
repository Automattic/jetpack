<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Assoc_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Boolean;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Enum;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Float;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Number;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_String;

class Schema {
	public static function as_string() {
		return new Validation_Rule( new Type_String() );
	}

	public static function as_array( $sub_schema = null ) {
		return new Validation_Rule( new Type_Array( $sub_schema ) );
	}

	public static function as_assoc_array( $sub_schema = null ) {
		return new Validation_Rule( new Type_Assoc_Array( $sub_schema ) );
	}

	public static function as_boolean() {
		return new Validation_Rule( new Type_Boolean() );
	}

	public static function as_number() {
		return new Validation_Rule( new Type_Number() );
	}

	public static function as_float() {
		return new Validation_Rule( new Type_Float( true ) );
	}

	public static function enum( $allowed_values ) {
		return new Validation_Rule( new Type_Enum( $allowed_values ) );
	}

}

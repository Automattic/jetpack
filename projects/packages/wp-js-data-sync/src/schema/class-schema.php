<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Any_JSON;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Assoc_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Boolean;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Enum;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Float;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Number;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_String;
/**
 * The Schema class is a factory for creating validation rules based on specific
 * schema types. It is a central point for defining the structure of your data
 * and ensuring that it conforms to the expected format. The class provides
 * static methods for creating Validation_Rule instances with different data types,
 * making it easy to build complex validation rules with a clean and readable syntax.
 *
 * The purpose of the Schema class is to provide a consistent way parse structured data.
 * By using this class, you can ensure that your data adheres to the defined schema and avoid issues
 * caused by incorrect data types or missing properties.
 *
 * How to use the Schema class:
 *
 * 1. Define your schema structure using the static methods provided by the Schema
 *    class, such as `as_string()`, `as_array()`, `as_boolean()`, `as_number()`,
 *    `as_float()`, and `enum()`. These methods return Validation_Rule instances
 *    for the respective data types.
 *
 * 2. Optionally, you can chain additional methods on the Validation_Rule instances
 *    to further customize the validation behavior. For example, you can use
 *    `fallback()` to specify a default value when the input data is invalid or
 *    `nullable()` to allow null values.
 *
 * 3. Validate and sanitize your data using the Validation_Rule instances. Call the
 *    `parse()` method on the Validation_Rule instance, passing in the input data
 *    to be parsed. The method will return the sanitized data or
 *    a default value (if specified) when the input data is invalid.
 *
 * Example:
 *
 * $my_schema = Schema::as_array(
 *     [
 *         'name' => Schema::as_string(),
 *         'age' => Schema::as_number()->fallback(0),
 *         'is_active' => Schema::as_boolean()->nullable(),
 *         'tags' => Schema::as_array(Schema::as_string())
 *     ]
 * );
 *
 * $input_data = [
 *     'name' => 'John Doe',
 *     'age' => 30,
 *     'is_active' => null,
 *     'tags' => ['tag1', 'tag2']
 * ];
 *
 * $sanitized_data = $my_schema->parse($input_data);
 *
 */
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

	public static function any_json_data() {
		return new Validation_Rule( new Type_Any_JSON() );
	}

}

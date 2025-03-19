<?php

namespace Automattic\Jetpack\Schema;

use Automattic\Jetpack\Schema\Modifiers\Modifier_Fallback;
use Automattic\Jetpack\Schema\Types\Type_Any;
use Automattic\Jetpack\Schema\Types\Type_Any_JSON;
use Automattic\Jetpack\Schema\Types\Type_Array;
use Automattic\Jetpack\Schema\Types\Type_Assoc_Array;
use Automattic\Jetpack\Schema\Types\Type_Boolean;
use Automattic\Jetpack\Schema\Types\Type_Enum;
use Automattic\Jetpack\Schema\Types\Type_Float;
use Automattic\Jetpack\Schema\Types\Type_Number;
use Automattic\Jetpack\Schema\Types\Type_String;
use Automattic\Jetpack\Schema\Types\Type_Void;

/**
 * The Schema class is a factory for creating and managing validation rules based on specific
 * schema types. It is a central point for defining the structure of your data
 * and ensuring that it conforms to the expected format.
 *
 * The class provides static methods for creating Schema instances with different data types,
 * making it easy to build complex validation rules with a clean and readable syntax.
 *
 * The purpose of the Schema class is to provide a consistent way to parse structured data.
 *
 * Use this to ensure that your data adheres to the defined schema and avoid issues
 * caused by incorrect data types or missing properties.
 *
 * How to use the Schema class:
 *
 * 1. Define your schema structure using the static methods provided by the Schema
 *    class, such as `as_string()`, `as_array()`, `as_boolean()`, `as_number()`,
 *    `as_float()`, and `enum()`. These methods return Schema instances
 *    for the respective data types.
 *
 * 2. Optionally, you can chain additional methods on the Schema instances
 *    to further customize the validation behavior. For example, you can use
 *    `fallback()` to specify a default value when the input data is invalid or
 *    `nullable()` to allow null values.
 *
 * 3. Parse your data using the Schema instances. Call the `parse()` method on the
 *    Schema instance, passing in the input data to be parsed.
 *    The method will return the parsed data or a default
 *    value (if specified) when the input data is invalid.
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
 * $parsed_data = $my_schema->parse($input_data);
 */
class Schema {
	const PACKAGE_VERSION = '0.2.3';

	public static function as_string() {
		return new Schema_Parser( new Type_String() );
	}

	/**
	 * @param Parser $parser - The parser to apply to each array item when $data is parsed.
	 *
	 * @return Schema_Parser
	 */
	public static function as_array( Parser $parser ) {
		return new Schema_Parser( new Type_Array( $parser ) );
	}

	/**
	 * @param array $assoc_parser_array - An associative array of ["key" => "Parser"] pairs
	 *
	 * @return Schema_Parser
	 */
	public static function as_assoc_array( $assoc_parser_array ) {
		return new Schema_Parser( new Type_Assoc_Array( $assoc_parser_array ) );
	}

	public static function as_boolean() {
		return new Schema_Parser( new Type_Boolean() );
	}

	public static function as_number() {
		return new Schema_Parser( new Type_Number() );
	}

	public static function as_float() {
		return new Schema_Parser( new Type_Float() );
	}

	/**
	 * @param array $allowed_values - An array of values that are allowed for this enum.
	 *
	 * @return Schema_Parser
	 */
	public static function enum( $allowed_values ) {
		return new Schema_Parser( new Type_Enum( $allowed_values ) );
	}

	public static function any_json_data() {
		return new Schema_Parser( new Type_Any_JSON() );
	}

	/**
	 * Mark a schema as void - it should have no data worth keeping, and
	 * will always parse to null.
	 */
	public static function as_void() {
		return new Schema_Parser( new Type_Void() );
	}

	/**
	 * Use With Caution! This will not parse the data - it will simply return it as-is.
	 * This is useful for delivering read-only data that we don't need to parse server-side.
	 *
	 * @see Type_Any
	 */
	public static function as_unsafe_any() {
		return new Schema_Parser( new Type_Any() );
	}

	/**
	 * @var \Automattic\Jetpack\Schema\Parser $parser - The parser to apply to each array item when $data is parsed.
	 */
	public static function either( ...$parsers ) {
		$or = new Modifier_Fallback();
		foreach ( $parsers as $parser ) {
			$or->add_fallback_parser( $parser );
		}
		return new Schema_Parser( $or );
	}
}

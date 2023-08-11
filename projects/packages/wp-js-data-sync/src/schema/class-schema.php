<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers\Decorate_With_Default;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Any_JSON;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Assoc_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Boolean;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Enum;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Float;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Number;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_String;

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
 *
 */
class Schema implements Parser {

	/**
	 * Each Schema entry has a Parser that's able to parse a value.
	 *
	 * @var Parser
	 */
	private $parser;

	public function __construct( Parser $parser ) {
		$this->parser = $parser;
	}

	/**
	 * Parses the input data according to the schema type.
	 *
	 * @param mixed $data The input data to be parsed.
	 *
	 * @return mixed The parsed data according to the schema type.
	 */
	public function parse( $data ) {
		return $this->parser->parse( $data );
	}

	/**
	 * Sets a fallback value for the schema type when the input data is invalid.
	 * This method returns a new instance of Decorate_With_Default, which wraps
	 * the current schema type and applies the fallback value.
	 *
	 * @param mixed $default_value The fallback value to use when the input data is invalid.
	 *
	 * @return Decorate_With_Default A new instance with the fallback value applied.
	 */
	public function fallback( $default_value ) {
		return new Decorate_With_Default( $this->parser, $default_value );
	}

	public function nullable() {

		return $this->fallback( null );
	}

	/**
	 * ==================================================================================
	 *      Static Utilities below:
	 *      This section defines the static methods for creating instances quickly.
	 * ==================================================================================
	 */

	public static function as_string() {
		return new self( new Type_String() );
	}

	/**
	 * @param Parser $parser - The parser to apply to each array item when $data is parsed.
	 *
	 * @return self
	 */
	public static function as_array( Parser $parser ) {
		return new self( new Type_Array( $parser ) );
	}

	/**
	 * @param $assoc_parser_array - An associative array of ["key" => "Parser" (or Validation_Rule)] pairs
	 *
	 * @return self
	 */
	public static function as_assoc_array( $assoc_parser_array ) {
		return new self( new Type_Assoc_Array( $assoc_parser_array ) );
	}

	public static function as_boolean() {
		return new self( new Type_Boolean() );
	}

	public static function as_number() {
		return new self( new Type_Number() );
	}

	public static function as_float() {
		return new self( new Type_Float( true ) );
	}

	/**
	 * @param $allowed_values mixed[] - An array of values that are allowed for this enum.
	 *
	 * @return Schema
	 */
	public static function enum( $allowed_values ) {
		return new self( new Type_Enum( $allowed_values ) );
	}

	public static function any_json_data() {
		return new self( new Type_Any_JSON() );
	}

}

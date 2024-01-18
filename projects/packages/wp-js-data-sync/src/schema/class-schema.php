<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers\Decorate_With_Default;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Any;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Any_JSON;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Assoc_Array;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Boolean;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Enum;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Float;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Number;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_String;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Void;

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

	/**
	 * @var Schema_Validation_Meta | null
	 */
	private $meta = null;

	private $is_root = false;

	/**
	 * @param Parser $parser
	 */
	public function __construct( Parser $parser ) {
		$this->parser = $parser;
	}

	public function set_meta( Schema_Validation_Meta $meta ) {
		$this->meta    = $meta;
		$this->is_root = true;
	}

	/**
	 * Parses the input data according to the schema type.
	 *
	 * @param mixed $value The input data to be parsed.
	 *
	 * @return mixed The parsed data according to the schema type.
	 * @throws Schema_Parsing_Error When the input data is invalid.
	 */
	public function parse( $value, $meta = null ) {
		if ( $meta === null && $this->meta === null ) {
			// 1 - If the meta is null, then this is maybe the root.
			$this->meta = new Schema_Validation_Meta( 'unknown' );
			$this->meta->set_data( $value );
			$this->is_root = true;
		} elseif ( $this->meta === null ) {
			// 2 - If the meta is not null, then this is not the root.
			$this->meta = $meta;
		}

		/**
		 * If this is the root, then we need to catch any errors and log them.
		 */
		if ( $this->is_root ) {
			try {
				return $this->parser->parse( $value, $this->meta );
			} catch ( Schema_Internal_Error $e ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					$value          = wp_json_encode( $e->get_value(), JSON_PRETTY_PRINT );
					$error_message  = "Failed to parse '{$this->meta->get_name()}' schema";
					$error_message .= "\n" . $e->getMessage();
					$error_message .= "\nData Received:";
					$error_message .= "\n$value";
					$error_message .= "\nSchema Path: {$this->meta->get_name()}.{$this->meta->get_path()}";
					// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
					error_log( $error_message );
				}

				throw new Schema_Parsing_Error( $e->getMessage(), $e->get_value(), $this->meta );
			}
		} else {
			return $this->parser->parse( $value, $this->meta );
		}
	}

	public function __toString() {
		return $this->parser->__toString();
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}

	public function schema() {
		return $this->parser->schema();
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
	 * @param $assoc_parser_array - An associative array of ["key" => "Parser"] pairs
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

	/**
	 * Mark a schema as void - it should have no data worth keeping, and
	 * will always parse to null.
	 */
	public static function as_void() {
		return new self( new Type_Void() );
	}

	/**
	 * Use With Caution! This will not parse the data - it will simply return it as-is.
	 * This is useful for delivering read-only data that we don't need to parse server-side.
	 *
	 * @see Type_Any
	 */
	public static function as_unsafe_any() {
		return new self( new Type_Any() );
	}
}

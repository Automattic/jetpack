<?php

use Automattic\Jetpack\WP_JS_Data_Sync\DS_Utils;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers\Type_Or;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Parsing_Error;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Meta;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Void;

class Schema_State implements Parser {
	/**
	 * Each Schema entry has a Parser that's able to parse a value.
	 *
	 * @var Parser
	 */
	private $parser;

	/**
	 * @var Schema_Validation_Meta
	 */
	private $meta;

	/**
	 * @param Parser $parser
	 */
	public function __construct( Parser $parser ) {
		$this->parser = $parser;
	}

	public function override_meta( Schema_Validation_Meta $meta ) {
		$this->meta = $meta;
	}

	public function get_log() {
		return $this->meta->get_log();
	}


	public function __toString() {
		return $this->parser->__toString();
	}

	/**
	 * Allow combining multiple types of schemas.
	 *
	 * @param Parser $parser
	 *
	 * @return $this
	 */
	public function or( Parser $parser ) {
		if ( $this->parser instanceof Type_Or ) {
			$this->parser->add_condition( $parser );
			return $this;
		}

		$this->parser = new Type_Or( $this->parser );
		$this->parser->add_condition( $parser );
		return $this;
	}


	/**
	 * Sets a fallback value for the schema type when the input data is invalid.
	 * This method returns a new instance of Decorate_With_Default, which wraps
	 * the current schema type and applies the fallback value.
	 *
	 * @param mixed $default_value The fallback value to use when the input data is invalid.
	 */
	public function fallback( $default_value ) {
		if ( DS_Utils::is_debug_enabled() ) {
			try {
				$debug_meta = new Schema_Validation_Meta( 'debug-mode' );
				$this->parser->parse( $default_value, $this->meta ?? $debug_meta );
			} catch ( Schema_Internal_Error $e ) {
				// Convert the internal error to a parsing error.
				throw new Schema_Parsing_Error( $e->getMessage(), $e->get_value(), $this->meta );
			}
		}

		$this->fallback = $default_value;
		return $this;
	}

	public function nullable() {
		$this->or( new Type_Void() );
		return $this->fallback( null );
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

		$meta = $meta ?? $this->meta ?? new Schema_Validation_Meta( 'unknown' );
		$meta->set_data( $value );
		$parser = $this->parser;

		try {
			$value = $parser->parse( $value, $meta );
			return $value;
		} catch ( Schema_Parsing_Error | Schema_Internal_Error $e ) {

			if ( DS_Utils::is_debug_enabled() ) {
				$value         = wp_json_encode( $e->get_value(), JSON_PRETTY_PRINT );
				$error_message = "Failed to parse '{$meta->get_name()}' schema";
				$error_message .= "\n" . $e->getMessage();
				$error_message .= "\nData Received:";
				$error_message .= "\n$value";
				$error_message .= "\nSchema Path: {$meta->get_name()}.{$meta->get_path()}";
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( $error_message );
			}

			if ( property_exists( $this, 'fallback' ) ) {
				return $this->fallback;
			}

			throw new Schema_Parsing_Error( $e->getMessage(), $e->get_value(), $meta );
		}
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}

	public function schema() {
		$schema = $this->parser->schema();
		if ( $this->has_fallback() ) {
			$schema['default'] = $this->fallback;
		}
		return $schema;
	}

	public function has_fallback() {
		return property_exists( $this, 'fallback' );
	}

	public function get_fallback() {
		return $this->fallback;
	}

}

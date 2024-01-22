<?php

use Automattic\Jetpack\WP_JS_Data_Sync\DS_Utils;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers\Type_Or;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Context;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Literal;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Void;

class Schema_State implements Parser {
	/**
	 * Each Schema entry has a Parser that's able to parse a value.
	 *
	 * @var Parser
	 */
	private $parser;

	/**
	 * @var Schema_Context|null
	 */
	private $context;

	/**
	 * @param Parser $parser
	 */
	public function __construct( Parser $parser ) {
		$this->parser = $parser;
	}

	public function set_context( Schema_Context $context ) {
		$this->context = $context;
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
			$this->parser->add_fallback_parser( $parser );
			return $this;
		}

		$this->parser = new Type_Or( $this->parser );
		$this->parser->add_fallback_parser( $parser );
		return $this;
	}

	/**
	 * Sets a fallback value for the schema type when the input data is invalid.
	 *
	 * @param mixed $default_value The fallback value to use when the input data is invalid.
	 *
	 * @throws Schema_Error When the input data is invalid and debug mode is enabled.
	 */
	public function fallback( $default_value ) {
		if ( DS_Utils::is_debug_enabled() ) {
			try {
				$this->parser->parse( $default_value, $this->context ?? new Schema_Context( 'debug-mode' ) );
			} catch ( Schema_Error $e ) {
				// Convert the internal error to a parsing error.
				throw new Schema_Error( $e->getMessage(), $e->get_value(), $this->context );
			}
		}

		$this->or( new Type_Literal( $default_value ) );
		return $this;
	}

	public function nullable() {
		$this->or( new Type_Void() );
		return $this;
	}

	/**
	 * Parses the input data according to the schema type.
	 *
	 * @param mixed $value The input data to be parsed.
	 *
	 * @return mixed The parsed data according to the schema type.
	 * @throws Schema_Error When the input data is invalid.
	 */
	public function parse( $value, $context = null ) {

		$context = $context ?? $this->context ?? new Schema_Context( 'unknown' );
		$context->set_data( $value );
		$parser = $this->parser;

		try {
			return $parser->parse( $value, $context );
		} catch ( Schema_Error $e ) {

			if ( DS_Utils::is_debug_enabled() ) {
				$value         = wp_json_encode( $e->get_value(), JSON_PRETTY_PRINT );
				$error_message = "Failed to parse '{$context->get_name()}' schema";
				$error_message .= "\n" . $e->getMessage();
				$error_message .= "\nData Received:";
				$error_message .= "\n$value";
				$error_message .= "\nSchema Path: {$context->get_name()}.{$context->get_path()}";
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( $error_message );
			}

			if ( $this->has_fallback() ) {
				return $this->get_fallback();
			}

			throw new Schema_Error( $e->getMessage(), $e->get_value(), $context );
		}
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}

	public function schema() {
		return $this->parser->schema();
	}

	public function has_fallback() {
		try {
			$this->get_fallback();
			return true;
		} catch ( Schema_Error $e ) {
			return false;
		}
	}

	public function get_fallback() {
		if ( $this->parser instanceof Type_Or ) {
			$parsers = $this->parser->get_parsers();
			foreach ( $parsers as $parser ) {
				if ( $parser instanceof Type_Literal ) {
					return $parser;
				}
			}
		}
		throw new Schema_Error( 'No fallback value defined for this schema', null, $this->context );
	}
}

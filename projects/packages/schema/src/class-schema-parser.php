<?php

namespace Automattic\Jetpack\Schema;

use Automattic\Jetpack\Schema\Modifiers\Modifier_Fallback;
use Automattic\Jetpack\Schema\Types\Type_Literal;
use Automattic\Jetpack\Schema\Types\Type_Void;

class Schema_Parser implements Parser {
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
	 * Allow combining multiple types of schemas internally for easier fallbacks.
	 * For a public or API, use `Schema::either()` instead.
	 *
	 * @param Parser $parser
	 *
	 * @return $this
	 * @see Schema::either()
	 */
	private function or( Parser $parser ) {
		if ( $this->parser instanceof Modifier_Fallback ) {
			$this->parser->add_fallback_parser( $parser );
			return $this;
		}

		// Keep track of the current parser
		$current_parser = $this->parser;
		// Replace the current parser with a new Modifier_Fallback parser
		$this->parser = new Modifier_Fallback();
		// Add the current parser back
		$this->parser->add_fallback_parser( $current_parser );
		// Add the new parser
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

		// In debug mode: Ensure that the fallback value can be parsed.
		if ( Utils::is_debug() ) {
			$this->parse( $default_value );
		}

		$this->or( new Type_Literal( $default_value ) );
		return $this;
	}

	/**
	 * Turn this schema into a nullable schema.
	 * This means that the schema will accept `null` as a valid value.
	 *
	 * @return $this
	 */
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
			$context->verbose_log(
				"Parse: {$parser}",
				array(
					'value' => $value,
				)
			);
			return $parser->parse( $value, $context );
		} catch ( Schema_Error $e ) {
			$context->log( "Schema_Error: {$this}->parse failed.", array(), $e );
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
		if ( $this->parser instanceof Modifier_Fallback ) {
			$parsers = $this->parser->get_parsers();
			foreach ( $parsers as $parser ) {
				if ( $parser instanceof Type_Literal ) {
					return $parser->parse( null, $this->context );
				}
			}
		}
		throw new Schema_Error( 'No fallback value defined for this schema', null, $this->context );
	}

	public function get_log() {
		return $this->context->get_log() ?? array();
	}
}

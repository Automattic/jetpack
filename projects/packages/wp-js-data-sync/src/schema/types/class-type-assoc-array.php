<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Assoc_Array implements Parser {
	private $parser;

	/**
	 * Assoc Array type takes in a parser in the constructor and
	 * will parse each keyed value in the array using the parser.
	 *
	 * @param Parser[] $assoc_parser_array - An associative array of parsers to use.
	 */
	public function __construct( array $assoc_parser_array ) {
		$this->parser = $assoc_parser_array;
	}

	/**
	 * This parse method expects that the $data passed to it is
	 * an associative array of values.
	 *
	 * It will then loop over each key that was provided in the constructor
	 * and pull the value based on that key from the $data array.
	 *
	 * @param $value mixed[]
	 *
	 * @return array
	 * @throws Schema_Internal_Error - If the $data passed to it is not an associative array.
	 *
	 */
	public function parse( $value, $meta = null ) {
		// Allow coercing stdClass objects (often returned from json_decode) to an assoc array.
		if ( is_object( $value ) && $value instanceof \stdClass ) {
			$value = (array) $value;
		}

		if ( ! is_array( $value ) || $this->is_sequential_array( $value ) ) {
			$message = "Expected an associative array, received '" . gettype( $value ) . "'";
			throw new Schema_Internal_Error( $message, $value );
		}

		$output = array();
		foreach ( $this->parser as $key => $parser ) {

			if ( null !== $meta ) {
				$meta->add_to_path( $key );
			}

			if ( ! isset( $value[ $key ] ) ) {
				$value[ $key ] = null;
			}

			$parsed = $parser->parse( $value[ $key ], $meta );
			// @TODO Document this behavior.
			// At the moment, values that are null are dropped from assoc arrays.
			// to match the Zod behavior.
			if ( $parsed !== null ) {
				$output[ $key ] = $parsed;
			}

			if ( null !== $meta ) {
				$meta->remove_path( $key );
			}
		}

		return $output;
	}

	private function is_sequential_array( $arr ) {
		if ( array() === $arr ) {
			return false;
		}
		return array_keys( $arr ) === range( 0, count( $arr ) - 1 );
	}

	public function __toString() {
		$results = array();
		foreach ( $this->parser as $key => $parser ) {
			$results[ $key ] = $parser;
		}
		return 'assoc_array(' . wp_json_encode( $results, JSON_PRETTY_PRINT ) . ')';
	}

	/**
	 * @return string
	 */
	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}

	public function schema() {
		$results = array();
		foreach ( $this->parser as $key => $parser ) {
			$results[ $key ] = $parser->schema();
		}
		return array(
			'type'  => 'assoc_array',
			'value' => $results,
		);
	}
}

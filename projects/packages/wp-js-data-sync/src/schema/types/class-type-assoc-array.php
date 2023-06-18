<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers\Decorate_With_Default;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

class Type_Assoc_Array implements Parser {
	private $assoc_parser_array;

	/**
	 * Assoc Array type takes in a parser in the constructor and
	 * will parse each keyed value in the array using the parser.
	 *
	 * @param Parser[] $assoc_parser_array - An associative array of parsers to use.
	 */
	public function __construct( array $assoc_parser_array ) {
		$this->assoc_parser_array = $assoc_parser_array;
	}

	/**
	 * This parse method expects that the $data passed to it is
	 * an associative array of values.
	 *
	 * It will then loop over each key that was provided in the constructor
	 * and pull the value based on that key from the $data array.
	 *
	 * @param $input_value mixed[]
	 * @throws \Error - If the $data passed to it is not an associative array.
	 *
	 * @return array
	 */
	public function parse( $input_value ) {
		// Allow coercing stdClass objects (often returned from json_decode) to an assoc array.
		if ( is_object( $input_value ) && get_class( $input_value ) === 'stdClass' ) {
			$input_value = (array) $input_value;
		}

		if ( ! is_array( $input_value ) || $this->is_sequential_array( $input_value ) ) {
			$message = "Expected an associative array, received '" . gettype( $input_value ) . "'";
			throw new \Error( $message );
		}

		$parsed = array();
		foreach ( $this->assoc_parser_array as $key => $parser ) {
			if ( ! isset( $input_value[ $key ] ) ) {
				if ( $parser instanceof Decorate_With_Default ) {
					$value = $parser->parse( null );

					// @TODO Document this behavior.
					// At the moment, values that are null are dropped from assoc arrays.
					// to match the Zod behavior.
					if ( $value !== null ) {
						$parsed[ $key ] = $value;
					}
				} else {
					$message = "Expected key '$key' in associative array";
					throw new \Error( $message );
				}
			} else {
				$parsed[ $key ] = $parser->parse( $input_value[ $key ] );
			}
		}

		return $parsed;
	}

	private function is_sequential_array( $arr ) {
		if ( array() === $arr ) {
			return false;
		}
		return array_keys( $arr ) === range( 0, count( $arr ) - 1 );
	}
}



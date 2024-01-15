<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers\Decorate_With_Default;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Error;

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
	 * @param $data mixed[]
	 *
	 * @return array
	 * @throws Schema_Validation_Error - If the $data passed to it is not an associative array.
	 *
	 */
	public function parse( $data, $meta ) {
		// Allow coercing stdClass objects (often returned from json_decode) to an assoc array.
		if ( is_object( $data ) && get_class( $data ) === 'stdClass' ) {
			$data = (array) $data;
		}

		if ( ! is_array( $data ) || $this->is_sequential_array( $data ) ) {
			$message = "Expected an associative array, received '" . gettype( $data ) . "'";
			throw new Schema_Validation_Error( $message, $data, $meta );
		}

		$parsed = array();
		foreach ( $this->assoc_parser_array as $key => $parser ) {
			$meta->add_to_path( $key );
			if ( ! isset( $data[ $key ] ) ) {
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
					throw new Schema_Validation_Error( $message, $data, $meta );
				}
			} else {
				$parsed[ $key ] = $parser->parse( $data[ $key ] );
			}
			$meta->remove_path( $key );
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

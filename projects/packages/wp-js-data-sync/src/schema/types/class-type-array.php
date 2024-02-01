<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Error;

class Type_Array implements Parser {
	private $parser;

	/**
	 * Array type takes in a parser in the constructor and
	 * will parse each value in the array using the parser.
	 *
	 * @param Parser $parser - the parser to use.
	 */
	public function __construct( Parser $parser ) {
		$this->parser = $parser;
	}

	/*
	 * This parse method expects that the $data passed to it is
	 * an array of other Parser instances.
	 *
	 * @param $data - an array of something to be parsed.
	 *
	 * @return array
	 */
	public function parse( $value, $context ) {
		if ( ! is_array( $value ) ) {
			$message = "Expected an array, received '" . gettype( $value ) . "'";
			throw new Schema_Error( $message, $value );
		}

		$parsed = array();
		foreach ( $value as $key => $item ) {
			$parsed[ $key ] = $this->parser->parse( $item, $context );
		}
		return $parsed;
	}

	/**
	 * @return string
	 */
	public function __toString() {
		return "array({$this->parser})";
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}

	public function schema() {
		return array(
			'type'  => 'array',
			'value' => $this->parser->schema(),
		);
	}
}

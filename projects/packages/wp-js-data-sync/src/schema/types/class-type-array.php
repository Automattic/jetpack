<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

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
	public function parse( $data ) {
		if ( ! is_array( $data ) ) {
			$message = "Expected an array, received '" . gettype( $data ) . "'";
			throw new \Error( $message );
		}

		$parsed = array();
		foreach ( $data as $key => $value ) {
			$parsed[ $key ] = $this->parser->parse( $value );
		}
		return $parsed;
	}
}

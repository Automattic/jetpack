<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

/**
 * This takes in a Schema Type (like a String/Number/Boolean) and a default value.
 * If the schema type parsing throws an error, this will catch it
 * and return the default value instead.
 */
class Decorate_With_Default implements Parser {
	private $parser;
	private $default_value;

	public function __construct( Parser $parser, $default_value ) {
		$this->parser        = $parser;
		$this->default_value = $default_value;
	}

	public function parse( $input_value ) {
		try {
			return $this->parser->parse( $input_value );
		} catch ( \Error $e ) {
			return $this->default_value;
		}
	}

	public function get_default_value() {
		return $this->default_value;
	}
}

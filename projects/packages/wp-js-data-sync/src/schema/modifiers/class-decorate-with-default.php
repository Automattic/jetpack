<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Parsing_Error;

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

	public function parse( $value, $meta = null ) {
		try {
			return $this->parser->parse( $value, $meta );
		} catch ( Schema_Internal_Error $e ) {
			return $this->default_value;
		} catch ( Schema_Parsing_Error $e ) {
			return $this->default_value;
		}
	}

	public function get_default_value() {
		return $this->default_value;
	}

	public function __toString() {
		return $this->parser->__toString() . ' (default: ' . $this->default_value . ')';
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}

	public function schema() {
		return $this->parser->schema() + array(
			'default' => $this->default_value,
		);
	}
}

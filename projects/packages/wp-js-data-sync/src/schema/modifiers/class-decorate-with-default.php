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

	public function parse( $value, $meta = null ) {
		try {
			return $this->parser->parse( $value, $meta );
		} catch ( \Exception $e ) {
			return $this->default_value;
		}
	}

	public function get_default_value() {
		return $this->default_value;
	}

	public function __toString() {
		$str = $this->parser->__toString();

		// Avoid double JSON Encoding.
		$value = json_decode( $str, ARRAY_A );
		if ( ! $value ) {
			$value = array();
		}

		$default_value = is_array( $this->default_value ) ? json_encode( $this->default_value ) : $this->default_value;
		$result        = json_encode(
			array(
				'type'    => $value,
				'default' => $default_value,
			)
		);
		if ( $result ) {
			return $result;
		}
		return $str;
	}

	public function jsonSerialize() {
		return $this->__toString();
	}
}

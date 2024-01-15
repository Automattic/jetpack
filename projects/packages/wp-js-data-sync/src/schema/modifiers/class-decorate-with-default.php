<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Validation_Meta;

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

	public function parse( $data, $meta = null ) {

		if ( $meta === null ) {
			$meta = new Schema_Validation_Meta( 'unknown' );
		}

		try {
			return $this->parser->parse( $data, $meta );
		} catch ( \Exception $e ) {
			return $this->default_value;
		}
	}

	public function get_default_value() {
		return $this->default_value;
	}
}

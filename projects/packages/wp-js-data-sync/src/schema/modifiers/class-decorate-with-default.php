<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

/**
 * This takes in a Schema Type (like a String/Number/Boolean) and a default value.
 * If the schema type parsing throws an error, this will catch it
 * and return the default value instead.
 */
class Decorate_With_Default implements Schema_Type {
	private $schema_type;
	private $default_value;

	public function __construct( Schema_Type $schema_type, $default_value ) {
		$this->schema_type   = $schema_type;
		$this->default_value = $default_value;
	}

	public function parse( $value ) {
		try {
			return $this->schema_type->parse( $value );
		} catch ( \Error $e ) {
			return $this->default_value;
		}
	}

	public function get_default_value() {
		return $this->default_value;
	}
}

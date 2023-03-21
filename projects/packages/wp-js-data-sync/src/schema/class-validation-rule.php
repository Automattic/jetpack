<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers\Decorate_With_Default;

/**
 * The Validation_Rule class is a wrapper around the Schema_Type interface
 * that provides additional utility methods for working with schema types.
 * It allows you to define validation rules based on specific schema types
 * and apply optional fallback values or nullable behavior.
 */
class Validation_Rule {
	private $type;

	public function __construct( Schema_Type $type ) {
		$this->type = $type;
	}

	/**
	 * Parses the input data according to the schema type.
	 *
	 * @param mixed $data The input data to be parsed.
	 *
	 * @return mixed The parsed data according to the schema type.
	 */
	public function parse( $data ) {
		return $this->type->parse( $data );
	}

	/**
	 * Sets a fallback value for the schema type when the input data is invalid.
	 * This method returns a new instance of Decorate_With_Default, which wraps
	 * the current schema type and applies the fallback value.
	 *
	 * @param mixed $default_value The fallback value to use when the input data is invalid.
	 *
	 * @return Decorate_With_Default A new instance with the fallback value applied.
	 */
	public function fallback( $default_value ) {
		return new Decorate_With_Default( $this->type, $default_value );
	}

	public function nullable() {
		return $this->fallback( null );
	}
}

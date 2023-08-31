<?php

namespace Automattic\Jetpack_Boost\Data_Sync\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

/**
 * A schema type for parsing numbers constrained to a specific range.
 *
 * This is a custom type to be used with Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema.
 */
class Type_Constrained_Number implements Parser {
	private $min;
	private $max;

	public function __construct( $min, $max ) {
		$this->min = $min;
		$this->max = $max;
	}

	public function parse( $data ) {
		if ( ! is_numeric( $data ) ) {
			throw new \Error( 'Invalid number' );
		}

		return (int) $this->clamp( $data );
	}

	private function clamp( $value ) {
		return min( max( $value, $this->min ), $this->max );
	}
}

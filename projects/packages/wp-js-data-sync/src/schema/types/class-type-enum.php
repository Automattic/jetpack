<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Internal_Error;

class Type_Enum implements Parser {

	/**
	 * @var $valid_values array The list of valid values for the enum.
	 */
	protected $valid_values;

	public function __construct( $valid_values ) {
		$this->valid_values = $valid_values;
	}

	public function parse( $value, $_meta = null ) {
		if ( ! in_array( $value, $this->valid_values, true ) ) {
			$message = sprintf( 'Invalid value "%s". Expected one of: %s', $value, implode( ', ', $this->valid_values ) );
			throw new Schema_Internal_Error( $message, $value );
		}
		return $value;
	}

	public function __toString() {
		$valid_values = implode( ',', $this->valid_values );
		return "enum($valid_values)";
	}

	#[\ReturnTypeWillChange]
	public function jsonSerialize() {
		return $this->schema();
	}

	public function schema() {
		$valid_values = $this->valid_values;
		foreach ( $valid_values as $key => $value ) {
			if ( is_object( $value ) && method_exists( $value, 'schema' ) ) {
				$valid_values[ $key ] = $value->schema();
			}
		}

		return array(
			'type'  => 'enum',
			'value' => $valid_values,
		);
	}
}

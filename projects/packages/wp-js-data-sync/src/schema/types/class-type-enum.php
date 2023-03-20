<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

class Type_Enum implements Schema_Type {

	protected $valid_values;

	public function __construct( $schema ) {
		$this->valid_values = $schema;
	}

	public function parse( $data ) {
		if ( ! in_array( $data, $this->valid_values, true ) ) {
			$message = sprintf( 'Invalid value "%s". Expected one of: %s', $data, implode( ', ', $this->valid_values ) );
			throw new \Error( $message );
		}
		return $data;
	}

}

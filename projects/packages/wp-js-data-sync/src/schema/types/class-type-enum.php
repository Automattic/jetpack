<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Type;

class Type_Enum implements Validation_Type {

	protected $valid_values;

	public function __construct( $schema ) {
		$this->valid_values = $schema;
	}

	public function validate( $array ) {
		return in_array( $array, $this->valid_values, true );
	}

	public function sanitize( $data ) {
		if ( $this->validate( $data ) ) {
			return $data;
		}
		return $this->valid_values[0];
	}




}

<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Type;

class Type_Optional implements Validation_Type {
	private $baseType;

	public function __construct( $baseType ) {
		$this->baseType = $baseType;
	}

	public function validate( $array ) {
		if ( empty( $array ) ) {
			// Only validate the type if the data is not empty.
			return true;
		}
		return $this->baseType->validate( $array );
	}

	public function sanitize( $data ) {
		if( empty( $data ) ) {
			// Only sanitize the type if the data is not empty.
			return null;
		}
		return $this->baseType->sanitize( $data );
	}
}

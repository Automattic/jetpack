<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

class Type_Array implements Schema_Type {
	private $sub_schema;

	public function __construct( $sub_schema ) {
		$this->sub_schema = $sub_schema;
	}

	public function parse( $data ) {
		if ( ! is_array( $data ) ) {
			$message = "Expected an array, received '" . gettype( $data ) . "'";
			throw new \Error( $message );
		}

		$sanitized_data = array();
		foreach ( $data as $key => $value ) {
			$sanitized_data[ $key ] = $this->sub_schema->parse( $value );
		}
		return $sanitized_data;
	}
}

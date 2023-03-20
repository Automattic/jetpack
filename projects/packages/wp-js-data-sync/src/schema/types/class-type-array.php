<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Type;

class Type_Array implements Validation_Type {
	private $array_schema;

	public function __construct( $subSchema ) {
		$this->array_schema = $subSchema;
	}

	public function validate( $arrays ) {
		foreach( $arrays as $arr) {
			if( $this->array_schema->validate( $arr ) === false ) {
				return false;
			}
		}

		return true;
	}

	public function sanitize( $data ) {

		$safe = [];
		foreach ( $this->array_schema as $key => $validator ) {
			if ( ! isset( $data[ $key ] ) ) {
				echo '<h1>HALP</h1>';
				dd( $key );
				continue;
			}
			$safe[ $key ] = $validator->sanitize( $data[ $key ] );
		}

		return $safe;
	}
}

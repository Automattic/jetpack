<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Valid_Rule_Exception;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema_Type;

class Modifier_Optional implements Schema_Type {
	private $base_type;

	public function __construct( $base_type ) {
		$this->base_type = $base_type;
	}

	public function parse( $data ) {
		return $this->base_type->sanitize( $data );
	}
}

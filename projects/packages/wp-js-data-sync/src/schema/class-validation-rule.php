<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Optional;

class Validation_Rule {
	private $type;

	public function __construct( Validation_Type $type ) {
		$this->type = $type;
	}

	public function validate( $data ) {
		return $this->type->validate( $data );
	}

	public function sanitize( $data ) {
		return $this->type->sanitize( $data );
	}

	public function optional() {
		return new Validation_Rule( new Type_Optional( $this->type ) );
	}

}

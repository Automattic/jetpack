<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Type_Optional;

class Validation_Rule {
	private $validationType;

	public function __construct( Validation_Type $validationType ) {
		$this->validationType = $validationType;
	}

	public function validate( $data ) {
		return $this->validationType->validate( $data );
	}

	public function sanitize( $data ) {
		return $this->validationType->sanitize( $data );
	}

	public function optional() {
		return new Validation_Rule( new Type_Optional( $this->validationType ) );
	}
	
}

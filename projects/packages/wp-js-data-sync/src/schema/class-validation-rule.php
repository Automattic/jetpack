<?php
namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Types\Modifier_Optional;

class Validation_Rule {
	private $type;

	public function __construct( Schema_Type $type ) {
		$this->type = $type;
	}

	public function parse( $data ) {
		return $this->type->parse( $data );
	}

	public function optional() {
		return new Validation_Rule( new Modifier_Optional( $this->type ) );
	}

}

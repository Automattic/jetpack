<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Modifiers\Decorate_Default;

class Validation_Rule {
	private $type;

	public function __construct( Schema_Type $type ) {
		$this->type = $type;
	}

	public function parse( $data ) {
		return $this->type->parse( $data );
	}

	public function fallback( $default_value ) {
		return new Decorate_Default( $this->type, $default_value );
	}

	public function nullable() {
		return new Decorate_Default( $this->type, null );
	}

}

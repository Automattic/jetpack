<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

class Schema_Internal_Error extends \RuntimeException {
	private $value;

	public function __construct( $message, $value ) {
		$this->value = $value;
		parent::__construct( $message );
	}

	public function get_value() {
		return $this->value;
	}
}

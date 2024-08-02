<?php

namespace Automattic\Jetpack\Schema;

class Schema_Error extends \RuntimeException {
	private $value;
	private $context;

	public function __construct( $message, $value, $context = null ) {
		$this->value   = $value;
		$this->context = $context;
		parent::__construct( $message );
	}

	public function get_value() {
		return $this->value;
	}

	public function get_context() {
		return $this->context;
	}
}

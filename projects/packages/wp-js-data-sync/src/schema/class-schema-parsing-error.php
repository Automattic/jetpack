<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

class Schema_Parsing_Error extends \RuntimeException {
	private $value;
	private $meta;

	public function __construct( $message, $value, $meta ) {
		$this->value = $value;
		$this->meta  = $meta;
		parent::__construct( $message );
	}

	public function get_value() {
		return $this->value;
	}

	public function get_meta() {
		return $this->meta;
	}
}

<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

class Schema_Internal_Error extends \RuntimeException {
	private $data;

	public function __construct( $message, $data ) {
		$this->data = $data;
		parent::__construct( $message );
	}

	public function get_data() {
		return $this->data;
	}
}

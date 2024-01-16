<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

class Schema_Parsing_Error extends \RuntimeException {
	private $data;
	private $meta;

	public function __construct( $message, $data, $meta ) {
		$this->data = $data;
		$this->meta = $meta;
		parent::__construct( $message );
	}

	public function get_data() {
		return $this->data;
	}
	public function get_meta() {
		return $this->meta;
	}
}

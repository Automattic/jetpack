<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry_Handler;

class Cloud_CSS_Sync extends Data_Sync_Entry_Handler {

	public function parse( $value ) {
		return $value;
	}

	public function validate( $value ) {
		return true;
	}

	public function sanitize( $value ) {
		return $value;
	}

	public function transform( $value ) {
		return $value;
	}

	public function get_default_value() {
		return array(
			'sources' => array(),
		);
	}
}

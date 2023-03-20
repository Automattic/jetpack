<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

class Valid_Rule_Exception extends \Exception {
	public function __construct( $message, $code = 0, \Exception $previous = null ) {
		parent::__construct( $message, $code, $previous );
	}
}

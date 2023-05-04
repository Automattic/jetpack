<?php

namespace Automattic\Jetpack\CRM\Automation;

class Automation_Exception extends \Exception {
	const STEP_CLASS_NOT_FOUND    = 10;
	const TRIGGER_CLASS_NOT_FOUND = 20;
	const GENERAL_ERROR           = 999;

	public function __construct( $message = 'Automation Exception', $code = self::GENERAL_ERROR ) {
		parent::__construct( $message, $code );
	}
}

<?php

namespace Automattic\Jetpack\CRM\Automation;

class Automation_Exception extends \Exception {
	const TRIGGER_NOT_EXIST       = 10;
	const TRIGGER_CLASS_NOT_FOUND = 11;
	const CONDITION_NOT_EXIST     = 20;
	const ACTION_NOT_EXIST        = 30;
	const GENERAL_ERROR           = 999;

	public function __construct( $message = 'Automation Exception', $code = self::GENERAL_ERROR ) {
		parent::__construct( $message, $code );
	}
}

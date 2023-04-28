<?php

namespace Automattic\Jetpack\CRM\Automation;

class Step_Exception extends \Exception {
    const STEP_TYPE_NOT_ALLOWED = 10;
	const STEP_CLASS_DOES_NOT_EXIST = 11;
}
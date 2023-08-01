<?php
/**
 * Jetpack CRM Automation data type exception.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds a Data_Type specific exception.
 *
 * @since $$next-version$$
 *
 * @package Automattic\Jetpack\CRM\Automation
 */
class Data_Type_Exception extends \Exception {
	const CLASS_NOT_FOUND    = 10;
	const DO_NOT_EXTEND_BASE = 11;
	const SLUG_EXISTS        = 12;
	const SLUG_DO_NOT_EXIST  = 13;
	const INVALID_ENTITY     = 20;
}

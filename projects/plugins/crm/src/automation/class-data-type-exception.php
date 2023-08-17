<?php
/**
 * Jetpack CRM Automation data type exception.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds a Data_Type specific exception.
 *
 * @since $$next-version$$
 */
class Data_Type_Exception extends \Exception {

	/**
	 * Error code for when the class doesn't exist.
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	const CLASS_NOT_FOUND = 10;

	/**
	 * Error code for when a transformer is passed, but doesn't extend the base class.
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	const DO_NOT_EXTEND_BASE = 11;

	/**
	 * Error code for when a slug is already being used.
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	const SLUG_EXISTS = 12;

	/**
	 * Error code for when a workflow tries to call a data type that doesn't exist.
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	const SLUG_DO_NOT_EXIST = 13;

	/**
	 * Error code for when the passed data do not match expected format/type.
	 *
	 * @since $$next-version$$
	 *
	 * @var int
	 */
	const INVALID_ENTITY = 20;

}

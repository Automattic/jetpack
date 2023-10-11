<?php
/**
 * Jetpack CRM Automation data transformer exception.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation;

/**
 * Adds a Data_Transformer specific exception.
 *
 * @since 6.2.0
 */
class Data_Transformer_Exception extends \Exception {

	/**
	 * Error code for when the class doesn't exist.
	 *
	 * @since 6.2.0
	 *
	 * @var int
	 */
	const CLASS_NOT_FOUND = 10;

	/**
	 * Error code for when a transformer is passed, but doesn't extend the base class.
	 *
	 * @since 6.2.0
	 *
	 * @var int
	 */
	const DO_NOT_EXTEND_BASE = 11;

	/**
	 * Error code for when a slug is already being used.
	 *
	 * @since 6.2.0
	 *
	 * @var int
	 */
	const SLUG_EXISTS = 12;

	/**
	 * Error code for when an object doesn't have a related ID to map to.
	 *
	 * @since 6.2.0
	 *
	 * @var int
	 */
	const MISSING_LINK = 20;

	/**
	 * Error code for when two objects cannot be mixed by the system (yet).
	 *
	 * @since 6.2.0
	 *
	 * @var int
	 */
	const TRANSFORM_IS_NOT_SUPPORTED = 30;
}

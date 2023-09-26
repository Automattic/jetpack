<?php
/**
 * Factory Exception.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

/**
 * Factory Exception.
 *
 * @since $$next-version$$
 */
class Factory_Exception extends \Exception {

	/**
	 * The error code for invalid data.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const INVALID_DATA = 1;

	/**
	 * The error code for invalid entity class.
	 *
	 * @since $$next-version$$
	 * @var int
	 */
	const INVALID_ENTITY_CLASS = 2;
}

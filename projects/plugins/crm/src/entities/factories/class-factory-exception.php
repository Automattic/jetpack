<?php
/**
 * Factory Exception.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

/**
 * Factory Exception.
 *
 * @since 6.2.0
 */
class Factory_Exception extends \Exception {

	/**
	 * The error code for invalid data.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const INVALID_DATA = 1;

	/**
	 * The error code for invalid entity class.
	 *
	 * @since 6.2.0
	 * @var int
	 */
	const INVALID_ENTITY_CLASS = 2;
}

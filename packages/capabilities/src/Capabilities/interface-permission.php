<?php
/**
 * Interface representing permission that is granted or denied, with context
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

interface Permission {
	/**
	 * Is permission granted?
	 *
	 * @return bool
	 */
	public function granted();

	/**
	 * A user-facing message
	 *
	 * @return string
	 */
	public function message();

	/**
	 * Data associated with the permission, e.g. plan upgrade URLs?
	 *
	 * @return array
	 */
	public function data();
}

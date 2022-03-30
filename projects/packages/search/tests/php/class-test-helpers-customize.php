<?php
/**
 * Helper class
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Used by Test_Helpers class.
 */
class Test_Helpers_Customize {
	/**
	 * Set default value
	 *
	 * @var bool
	 */
	public $previewing = false;
	/**
	 * Return default value
	 */
	public function is_preview() {
		return (bool) $this->previewing;
	}
}

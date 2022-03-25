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
class Test_Helpers_Query {
	/**
	 * Set default value
	 *
	 * @var bool
	 */
	public $searching = true;
	/**
	 * Return default value
	 */
	public function is_search() {
		return $this->searching;
	}
}

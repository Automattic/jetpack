<?php
/**
 * Jetpack Search: Instant Front-End Search and Filtering
 *
 * @since 9.9.0
 * @package automattic/jetpack
 */

/**
 * Class to expose some protected members for testing
 *
 * @since 9.9.0
 */
class Jetpack_Instant_Search_Child extends Jetpack_Instant_Search {
	/**
	 * Access private member
	 */
	public function get_old_sidebars_widgets() {
		return $this->old_sidebars_widgets;
	}

	/**
	 * Access private member
	 *
	 * @param array $val The value to be set.
	 */
	public function set_old_sidebars_widgets( $val = null ) {
		$this->old_sidebars_widgets = $val;
	}
}

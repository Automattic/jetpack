<?php
/**
 * Mock class to help make Jetpack_Podcast_Helper more testable.
 *
 * @package jetpack
 */

/**
 * Class Mock_SimplePie
 */
class Mock_SimplePie {
	/**
	 * Mock of get_items().
	 *
	 * @return \Mock_SimplePie_Item[]
	 */
	public function get_items() {
		return array(
			new Mock_SimplePie_Item( 0 ),
			new Mock_SimplePie_Item( 1 ),
		);
	}
}

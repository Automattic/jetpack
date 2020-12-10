<?php
/**
 * Mock class to help make Jetpack_Podcast_Helper more testable.
 *
 * @package jetpack
 */

/**
 * Class SimplePie
 */
class SimplePie {
	/**
	 * Mock of get_items().
	 *
	 * @return \SimplePie_Item[]
	 */
	public function get_items() {
		return array(
			new SimplePie_Item( 0 ),
			new SimplePie_Item( 1 ),
		);
	}
}

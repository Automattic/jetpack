<?php
/**
 * Implements a basic interface of the SimplePie class in environments where it doesn't exist.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'SimplePie' ) ) {
	/**
	 * Class SimplePie
	 */
	class SimplePie {
		/**
		 * Get a list or items.
		 *
		 * @return \SimplePie_Item[]
		 */
		public function get_items() {
			return null;
		}
	}
}

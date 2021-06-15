<?php
/**
 * Implements a basic interface of the SimplePie_Item class in environments where it doesn't exist.
 *
 * @package automattic/jetpack
 */

if ( ! class_exists( 'SimplePie_Item' ) ) {
	/**
	 * Class SimplePie_Item.
	 */
	class SimplePie_Item {
		/**
		 * Returns ID.
		 *
		 * @return int
		 */
		public function get_id() {
			return null;
		}
	}
}

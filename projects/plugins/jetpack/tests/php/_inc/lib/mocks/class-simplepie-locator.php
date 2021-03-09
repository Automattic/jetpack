<?php
/**
 * Implements a basic interface of the SimplePie_Locator class in environments where it doesn't exist.
 *
 * @package automattic/jetpack
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

if ( ! class_exists( 'SimplePie_Locator' ) ) {
	/**
	 * Class SimplePie_Locator
	 */
	class SimplePie_Locator {
		/**
		 * Overrides the locator is_feed function to check for
		 * appropriate podcast elements.
		 *
		 * @param SimplePie_File $file The file being checked.
		 * @param boolean        $check_html Adds text/html to the mimetypes checked.
		 */
		public function is_feed( $file, $check_html = false ) {
			return true;
		}
	}
}

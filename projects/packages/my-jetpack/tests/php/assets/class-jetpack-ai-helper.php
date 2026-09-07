<?php
/**
 * Stands in for the Jetpack plugin's Jetpack_AI_Helper, which this package cannot load.
 *
 * Declaring it means Jetpack_Ai::get_ai_assistant_feature() finds the class and skips
 * its require, so tests control what the AI feature lookup returns.
 *
 * @package automattic/my-jetpack
 */

if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
	/**
	 * Test double returning whatever the current test set.
	 */
	class Jetpack_AI_Helper { // phpcs:ignore Generic.Classes.OpeningBraceSameLine.ContentAfterBrace
		/**
		 * Return the response the test asked for.
		 *
		 * @return mixed
		 */
		public static function get_ai_assistance_feature() {
			return $GLOBALS['jpai_ai_feature_response'] ?? array();
		}
	}
}

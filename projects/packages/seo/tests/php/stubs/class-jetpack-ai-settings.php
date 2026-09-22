<?php
/**
 * Test stub for the host plugin's Jetpack_AI_Settings class.
 *
 * @package automattic/jetpack-seo
 */

if ( ! class_exists( 'Jetpack_AI_Settings' ) ) {

	/**
	 * Stub of the host plugin's AI settings registry.
	 */
	class Jetpack_AI_Settings {

		/**
		 * Whether the AI SEO control reports on.
		 *
		 * @var bool
		 */
		public static $is_ai_seo_enabled = true;

		/**
		 * Return the configured AI SEO state.
		 *
		 * @return bool
		 */
		public static function is_ai_seo_enabled(): bool {
			return self::$is_ai_seo_enabled;
		}
	}
}

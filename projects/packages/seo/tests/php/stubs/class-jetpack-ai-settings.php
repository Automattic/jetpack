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
		 * Whether the site-wide Jetpack AI switch reports on.
		 *
		 * @var bool
		 */
		public static $is_ai_enabled = true;

		/**
		 * Return the configured Jetpack AI state.
		 *
		 * @return bool
		 */
		public static function is_ai_enabled(): bool {
			return self::$is_ai_enabled;
		}

		/**
		 * Return the configured AI SEO state, off whenever Jetpack AI is, as in the real class.
		 *
		 * @return bool
		 */
		public static function is_ai_seo_enabled(): bool {
			return self::$is_ai_seo_enabled && self::$is_ai_enabled;
		}
	}
}

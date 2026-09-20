<?php
/**
 * Test stub for the host plugin's Jetpack_AI_Sidebar class.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\Extensions\AiAssistantPlugin;

if ( ! class_exists( __NAMESPACE__ . '\\Jetpack_AI_Sidebar' ) ) {

	/**
	 * Stub of the host plugin's AI sidebar loader.
	 */
	class Jetpack_AI_Sidebar {

		/**
		 * Whether the stub reports a host that loads the sidebar.
		 *
		 * @var bool
		 */
		public static $is_host_enabled = false;

		/**
		 * Return the configured host state.
		 *
		 * @return bool
		 */
		public static function is_host_enabled(): bool {
			return self::$is_host_enabled;
		}
	}
}

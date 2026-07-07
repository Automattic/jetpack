<?php
/**
 * Minimal stand-in for Automattic\Jetpack\Sync\Settings.
 *
 * The podcast package doesn't depend on jetpack-sync, so the real class isn't
 * autoloaded in this package's test env. The Podcast Episode render callback
 * probes Settings::is_syncing() to render the full player into the content
 * Jetpack Sync pre-renders for the WPCOM Reader; this stub lets that path run.
 *
 * @package automattic/jetpack-podcast
 */

if ( ! class_exists( '\Automattic\Jetpack\Sync\Settings' ) ) {
	/**
	 * Mock Settings exposing only the is_syncing toggle the block reads.
	 */
	class Mock_Podcast_Sync_Settings {
		/**
		 * Whether Sync is currently rendering filtered content.
		 *
		 * @var bool
		 */
		private static $is_syncing = false;

		/**
		 * Set the syncing flag.
		 *
		 * @param bool $is_syncing Whether Sync is rendering content.
		 */
		public static function set_is_syncing( $is_syncing ) {
			self::$is_syncing = (bool) $is_syncing;
		}

		/**
		 * Whether Sync is currently rendering filtered content.
		 *
		 * @return bool
		 */
		public static function is_syncing() {
			return self::$is_syncing;
		}
	}
	class_alias( 'Mock_Podcast_Sync_Settings', '\Automattic\Jetpack\Sync\Settings' );
}

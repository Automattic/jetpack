<?php
/**
 * Poll Daddy.
 *
 * @package Jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_Sync' ) ) {
	/**
	 * Jetpack Sync.
	 */
	class Jetpack_Sync {
		/**
		 * Sync Options.
		 *
		 * @return [type] [description]
		 */
		static function sync_options() {
			_deprecated_function( __METHOD__, 'jetpack-4.2', 'jetpack_options_whitelist filter' );
		}
	}
}

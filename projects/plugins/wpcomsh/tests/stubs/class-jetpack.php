<?php
/**
 * Jetpack stub for tests that run in a separate process; kept out of tests/lib so it never loads globally.
 *
 * @package wpcomsh
 */

if ( ! class_exists( 'Jetpack' ) ) {
	/**
	 * Minimal stand-in for the Jetpack plugin's static API.
	 */
	class Jetpack {
		/**
		 * Mirrors Jetpack::is_connection_ready().
		 *
		 * @return bool
		 */
		public static function is_connection_ready() {
			return JetpackAiModuleSeedTest::$connection_ready;
		}

		/**
		 * Mirrors Jetpack::is_module_active().
		 *
		 * @param string $module Module slug.
		 * @return bool
		 */
		public static function is_module_active( $module ) {
			return in_array( $module, JetpackAiModuleSeedTest::$active_modules, true );
		}

		/**
		 * Mirrors Jetpack::activate_module().
		 *
		 * @param string $module   Module slug.
		 * @param bool   $exit     Unused.
		 * @param bool   $redirect Unused.
		 * @return bool
		 */
		public static function activate_module( $module, $exit = true, $redirect = true ) {
			JetpackAiModuleSeedTest::$activate_calls[] = array( $module, $exit, $redirect );
			if ( JetpackAiModuleSeedTest::$activate_result && JetpackAiModuleSeedTest::$activation_sticks ) {
				JetpackAiModuleSeedTest::$active_modules[] = $module;
			}
			return JetpackAiModuleSeedTest::$activate_result;
		}
	}
}

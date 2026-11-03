<?php
/**
 * A drop-in for WordPress.com's Store_Sandbox, which is not loaded here.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! class_exists( 'Store_Sandbox' ) ) {
	/**
	 * Reports the store as sandboxed when `$GLOBALS['store_sandbox_test_value']` is set.
	 */
	class Store_Sandbox {
		/**
		 * @return Store_Sandbox
		 */
		public static function get_instance(): Store_Sandbox {
			return new self();
		}

		/**
		 * @return bool
		 */
		public function is_sandboxed(): bool {
			return ! empty( $GLOBALS['store_sandbox_test_value'] );
		}
	}
}

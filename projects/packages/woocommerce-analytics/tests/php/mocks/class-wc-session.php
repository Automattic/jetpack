<?php
/**
 * Mock WC_Session class for testing.
 *
 * @package automattic/woocommerce-analytics
 */

if ( ! class_exists( 'WC_Session' ) ) {
	/**
	 * Mock WC_Session class for testing.
	 */
	class WC_Session {
		/**
		 * Session data storage.
		 *
		 * @var array
		 */
		private $data = array();

		/**
		 * Get a session variable.
		 *
		 * @param string $key Key to get.
		 * @param mixed  $default Default value if key doesn't exist.
		 * @return mixed
		 */
		public function get( $key, $default = null ) {
			return $this->data[ $key ] ?? $default;
		}

		/**
		 * Set a session variable.
		 *
		 * @param string $key Key to set.
		 * @param mixed  $value Value to set.
		 */
		public function set( $key, $value ) {
			$this->data[ $key ] = $value;
		}

		/**
		 * Save session data (no-op in mock).
		 */
		public function save_data() {
			// No-op in tests.
		}

		/**
		 * Get all session data (for testing).
		 *
		 * @return array
		 */
		public function get_all_data() {
			return $this->data;
		}

		/**
		 * Clear all session data (for testing).
		 */
		public function clear_data() {
			$this->data = array();
		}
	}
}

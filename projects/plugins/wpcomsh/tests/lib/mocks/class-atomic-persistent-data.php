<?php
/**
 * Atomic Persistent Data file.
 *
 * @package wpcomsh
 */

if ( ! class_exists( 'Atomic_Persistent_Data' ) ) {
	/**
	 * Mock for the persistent data class.
	 */
	final class Atomic_Persistent_Data {
		/**
		 * Data store.
		 *
		 * @var array
		 */
		public static $data = array();

		/**
		 * Set data.
		 *
		 * @param string $key   Key.
		 * @param string $value Value.
		 */
		public static function set( $key, $value ) {
			self::$data[ $key ] = $value;
		}

		/**
		 * Delete data.
		 *
		 * @param string $key Key.
		 */
		public static function delete( $key ) {
			if ( isset( self::$data[ $key ] ) ) {
				unset( self::$data[ $key ] );
			}
		}

		/**
		 * Get data.
		 *
		 * @param string $key Key.
		 * @return string|null
		 */
		public function __get( $key ) {
			if ( isset( self::$data[ $key ] ) ) {
				return self::$data[ $key ];
			}

			return null;
		}
	}
}

<?php

namespace Automattic\Jetpack_Boost\Data_Sync\Read_Only;

use Automattic\Jetpack\WP_JS_Data_Sync\Storage_Drivers\Storage_Driver;

/**
 * A data-sync storage driver to fetch values that are not stored in the database.
 */
class Storage implements Storage_Driver {
		/**
		 * The namespace for this storage driver.
		 *
		 * @var string
		 */
		private $namespace;

		private $sources = array(
			'available_modules' => 'Automattic\Jetpack_Boost\Data_Sync\Read_Only\Available_Modules',
		);

		/**
		 * Read_Only constructor.
		 *
		 * @param string                  $namespace The namespace for this storage driver.
		 */
		public function __construct( $namespace ) {
			$this->namespace = $namespace;
		}

		/**
		 * Get the stored value by key.
		 *
		 * @param string $key Key.
		 * @throws \Exception If the key is not found.
		 *
		 * @return mixed
		 */
		public function get( $key ) {
			if ( ! isset( $this->sources[ $key ] ) ) {
				throw new \Exception( 'Config handler not found for key ' . $key );
			}
			$source = new $this->sources[ $key ]();

			return $source->get_value();
		}

		public function set( $key, $value ) {
			throw new \Exception( 'Read_Only Storage does not support set()' );
		}

		public function delete( $key ) {
			throw new \Exception( 'Read_Only Storage does not support delete()' );
		}
}

<?php

namespace Automattic\Jetpack_Boost\Data_Sync\Read_Only;

use Automattic\Jetpack\WP_JS_Data_Sync\Storage_Drivers\Storage_Driver;

/**
 * A data-sync storage driver to fetch values that are not stored in the database.
 */
abstract class Storage implements Storage_Driver {
		/**
		 * The namespace for this storage driver.
		 *
		 * @var string
		 */
		private $namespace;

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
	abstract public function get( $key );

	public function set( $key, $value ) {
		throw new \Exception( 'Read_Only Storage does not support set()' );
	}

	public function delete( $key ) {
		throw new \Exception( 'Read_Only Storage does not support delete()' );
	}
}

<?php
/**
 * An Object Cache drop-in class for testing purposes.
 */

class Jetpack_Test_Object_Cache extends WP_Object_Cache {

	public $cache = array();

	public function set( $key, $data, $group = NULL, $expire = 600 ) {
		$this->cache[ $key ] = $data;

		return true;
	}

	public function get( $key, $group = 'default', $force = false, &$found = null ) {
		if ( isset( $this->cache[ $key ] ) ) {
			$found = true;
			return $this->cache[ $key ];
		}
		$found = false;
		return false;
	}
}
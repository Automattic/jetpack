<?php

namespace Automattic\Jetpack\Packages\Async_Option\Storage;


class WP_Option implements Storage {


	public function __construct( $namepsace ) {
		$this->namespace = $namepsace;
	}

	public function get( $key, $default = false ) {
		return get_option( $this->key( $key ), $default );
	}


	public function set( $key, $value ) {
		return update_option( $this->key( $key ), $value );
	}

	public function delete( $key ) {
		return delete_option( $this->key( $key ) );
	}


	public function key( $key ) {
		return $this->namespace . '_' . $key;
	}
}

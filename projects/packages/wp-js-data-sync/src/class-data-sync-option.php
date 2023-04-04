<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;

final class Data_Sync_Option {

	private $key;

	private $option_key;

	public function __construct( $namespace, $key ) {
		$this->namespace  = $namespace;
		$this->key        = $key;
		$this->option_key = $this->namespace . '_' . $this->key;
	}

	public function get() {
		return get_option( $this->option_key );
	}

	public function set( $value ) {
		update_option( $this->option_key, $value );
	}

	public function delete() {
		delete_option( $this->option_key );
	}

}

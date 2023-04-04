<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Delete;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;

final class Data_Sync_Option implements Entry_Can_Get, Entry_Can_Set, Entry_Can_Delete {

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

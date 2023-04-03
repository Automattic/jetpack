<?php


namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Can_Delete;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry;

final class Data_Sync_Option implements Data_Sync_Entry, Can_Set, Can_Delete {

	private $key;

	private $option_key;

	public function __construct( $namespace, $key, $schema ) {
		$this->namespace  = $namespace;
		$this->key        = $key;
		$this->schema     = $schema;
		$this->option_key = $this->namespace . '_' . $this->key;

	}

	public function get() {
		$value = get_option( $this->option_key );
		return $this->schema->parse( $value );
	}

	public function set( $value ) {
		$value = $this->schema->parse( $value );
		return update_option( $this->option_key, $value );
	}

	public function delete() {
		return delete_option( $this->option_key );
	}

}

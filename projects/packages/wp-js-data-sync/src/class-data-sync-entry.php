<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;

class Data_Sync_Entry {
	private $entry;
	private $schema;

	public function __construct( $entry, $schema ) {
		$this->entry  = $entry;
		$this->schema = $schema;
	}

	public function can( $method ) {
		// $methods = array(
		// 'get' => Entry_Can_Get::class,
		// ''
		// );
		return method_exists( $this->entry, $method );
	}

	public function get() {
		return $this->schema->parse( $this->entry->get() );
	}

	public function set( $value ) {
		if ( $this->can( 'set' ) ) {
			$parsed_value = $this->schema->parse( $value );
			$this->entry->set( $parsed_value );
		}
		return $this->get();
	}

	public function update( $value ) {
		if ( $this->can( 'merge' ) ) {
			$updated_value = $this->entry->merge( $value );
			$this->set( $updated_value );
		}
		return $this->get();
	}

	public function delete() {
		if ( $this->can( 'delete' ) ) {
			$this->entry->delete();
		}
		return $this->get();
	}

}

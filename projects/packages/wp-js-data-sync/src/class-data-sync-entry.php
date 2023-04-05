<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Delete;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Merge;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Validation_Rule;

class Data_Sync_Entry {
	private $entry;
	private $schema;

	/**
	 * @param $entry  (Entry_Can_Get & (Entry_Can_Set | Entry_Can_Merge | Entry_Can_Delete)) - The data sync entry.
	 * @param $schema Validation_Rule - The schema for the data sync entry.
	 */
	public function __construct( $entry, $schema ) {
		$this->entry  = $entry;
		$this->schema = $schema;
	}

	public function can( $method ) {
		$interface_map = array(
			'get'    => Entry_Can_Get::class,
			'set'    => Entry_Can_Set::class,
			'merge'  => Entry_Can_Merge::class,
			'delete' => Entry_Can_Delete::class,
		);

		if ( isset( $interface_map[ $method ] ) ) {
			return $this->entry instanceof $interface_map[ $method ] && method_exists( $this->entry, $method );
		}

		return false;
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

	public function merge( $partial_value ) {
		if ( $this->can( 'merge' ) ) {
			$updated_value = $this->entry->merge( $this->entry->get(), $partial_value );
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

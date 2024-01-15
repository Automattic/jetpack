<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

class Schema_Validation_Meta {

	private $name = '';
	private $path = [];


	/**
	 * @param string $name
	 */
	public function __construct( $name ) { $this->name = $name; }

	public function add_to_path( $key ) {
		$this->path[] = $key;
	}

	public function get_path() {
		return implode( '.', $this->path );
	}

	public function remove_path( $key ) {
		$index = array_search( $key, $this->path, true );
		if ( $index !== false ) {
			unset( $this->path[ $index ] );
		}
		// Reindex the array.
		$this->path = array_values( $this->path );
	}

	public function get_name() {
		return $this->name;
	}


}

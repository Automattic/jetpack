<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Schema;

use Automattic\Jetpack\WP_JS_Data_Sync\DS_Utils;

class Schema_Context {

	private $name;
	private $data;
	private $path = array();

	/**
	 * @var array $log Log of notable actions taken during parsing.
	 */
	private $log = array();

	/**
	 * @param string $name
	 */
	public function __construct( $name ) {
		$this->name = $name;
	}

	public function add_to_path( $key ) {
		$this->path[] = $key;
	}

	public function log( $message, $data ) {
		if ( ! DS_Utils::is_debug_enabled() ) {
			return;
		}
		$this->log[] = array(
			'message' => $message,
			'data'    => $data,
		);
	}

	public function get_log() {
		return $this->log;
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

	public function set_data( $data ) {
		if ( ! isset( $this->data ) ) {
			$this->data = $data;
		}

	}

	public function get_data() {
		return $this->data;
	}
}

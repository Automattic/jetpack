<?php

namespace Automattic\Jetpack\Schema;

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

	private function trace( $depth_limit = 15 ) {

		if ( ! Utils::is_debug() ) {
			return;
		}

		$trace = array();
		// This is fine, it's guarded by `SCHEMA_TRACE` constant.
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace
		foreach ( debug_backtrace() as $stack_frame ) {
			if ( isset( $stack_frame['line'], $stack_frame['file'] ) ) {
				$filename_pieces = explode( '.', basename( $stack_frame['file'] ), 2 );
				$trace[]         = $filename_pieces[0] . ':' . $stack_frame['line'];
			} elseif ( isset( $stack_frame['class'], $stack_frame['function'] ) ) {
				$trace[] = $stack_frame['class'] . '::' . $stack_frame['function'];
			}

			--$depth_limit;
			if ( $depth_limit <= 0 ) {
				break;
			}
		}
		return $trace;
	}

	public function log( $message, $data, $error = null ) {
		if ( ! Utils::is_debug() ) {
			return;
		}

		$meta = array(
			'name' => $this->get_name(),
			'path' => $this->get_path(),
		);

		$trace = defined( 'SCHEMA_TRACE' ) && \SCHEMA_TRACE > 0 ? $this->trace( \SCHEMA_TRACE ) : null;
		if ( $trace ) {
			$meta['trace'] = $trace;
		}

		if ( $error instanceof Schema_Error ) {
			$meta['error_message'] = $error->getMessage();
			$meta['value']         = $error->get_value();
		}

		$this->log[] = array(
			'message' => $message,
			'meta'    => $meta,
		);
	}

	public function verbose_log( $message, $data ) {
		if ( ! Utils::is_verbose() ) {
			return;
		}
		$this->log( $message, $data );
	}

	public function get_log() {
		return $this->log;
	}

	public function get_path() {
		$path = $this->name;
		if ( ! empty( $this->path ) ) {
			$path .= '.' . implode( '.', $this->path );
		}
		return $path;
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

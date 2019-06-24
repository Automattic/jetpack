<?php

namespace Automattic\Jetpack\Analyzer;

class Invocations {
	private $invocations;

	function __construct() {
		$this->invocations = array();
	}

	public function get() {
		return $this->invocations;
	}

	public function add( $invocation ) {
		$this->invocations[] = $invocation;
	}

	public function print() {
		echo $this->save( 'php://memory' );
	}

	/**
	 * Saves the invocations to a file and returns the file contents
	 */
	public function save( $file_path ) {
		$handle = fopen( $file_path, 'r+');
		foreach ( $this->invocations as $invocation ) {
			fputcsv( $handle, $invocation->to_csv_array() );
		}
		rewind( $handle );
		$contents = stream_get_contents( $handle );
		fclose( $handle );
		return $contents;
	}
}
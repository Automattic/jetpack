<?php

namespace Automattic\Jetpack\Analyzer;

/**
 * Handy class for persisting a list of objects that support the to_csv_array method
 */
class PersistentList {
	private $items;

	function __construct() {
		$this->items = array();
	}

	public function get() {
		return $this->items;
	}

	public function add( $item ) {
		$this->items[] = $item;
	}

	public function print() {
		echo $this->save( 'php://memory' );
	}

	/**
	 * Saves the items to a file and returns the file contents
	 */
	public function save( $file_path ) {
		$handle = fopen( $file_path, 'r+');
		foreach ( $this->items as $item ) {
			fputcsv( $handle, $item->to_csv_array() );
		}
		rewind( $handle );
		$contents = stream_get_contents( $handle );
		fclose( $handle );
		return $contents;
	}
}
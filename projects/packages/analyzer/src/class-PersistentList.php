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
		if ( ! is_subclass_of( $item, 'Automattic\Jetpack\Analyzer\PersistentList\Item' ) ) {
			throw new \Exception( 'item must extend Automattic\Jetpack\Analyzer\PersistentList\Item' );
		}
		$this->items[] = $item;
	}

	public function count() {
		return count( $this->items );
	}

	public function output() {
		echo $this->save( 'php://memory' );
	}

	/**
	 * Saves the items to a file and returns the file contents
	 */
	public function save( $file_path, $allow_empty = true ) {

		// Not saving empty files if empty files are not allowed to be saved
		if ( ! $allow_empty && empty( $this->items ) ) {
			return '';
		}

		if ( 'php://memory' !== $file_path && ! file_exists( dirname( $file_path ) ) ) {
			mkdir( dirname( $file_path ), 0777, true );
		}

		$handle = fopen( $file_path, 'w+' );
		foreach ( $this->items as $item ) {
			fputcsv( $handle, $item->to_csv_array() );
		}
		rewind( $handle );
		$contents = stream_get_contents( $handle );
		fclose( $handle );
		return $contents;
	}

	/**
	 * Serializes the list into a JSON file.
	 *
	 * @param string $file_path JSON file path.
	 * @param bool   $allow_empty Allow empty files.
	 */
	public function save_json( $file_path, $allow_empty = true ) {

		if ( ! $allow_empty && empty( $this->items ) ) {
			return '';
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents
		if ( ! file_exists( dirname( $file_path ) ) ) {
			mkdir( dirname( $file_path ), 0777, true );
		}
		file_put_contents( // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_file_put_contents
			$file_path,
			json_encode( // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
				array_map(
					function ( $item ) {
						return $item->to_map();
					},
					$this->items
				)
			)
		);
	}
}

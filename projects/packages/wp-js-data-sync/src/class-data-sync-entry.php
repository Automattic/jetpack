<?php
/**
 * Data_Sync_Entries manage the data of a single entry.
 * Each entry has:
 *      - a key
 *      - a storage driver
 *      - handler that deals with data validation, sanitization.
 *
 * This class pulls all those together and provides a simple interface to get/set/delete data.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamComment
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamName
// phpcs:disable Squiz.Commenting.FunctionComment.MissingParamTag
// phpcs:disable Squiz.Commenting.FunctionComment.MissingReturn
// phpcs:disable Generic.Commenting.DocComment.MissingShort
// phpcs:disable Squiz.Commenting.FunctionComment.Missing
// phpcs:disable Squiz.Commenting.ClassComment.Missing
// phpcs:disable Squiz.Commenting.FileComment.Missing

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Storage_Drivers\Storage_Driver;

class Data_Sync_Entry {

	/**
	 * @var string
	 */
	private $key;

	/**
	 * @var Storage_Driver
	 */
	protected $storage;

	/**
	 * @var Data_Sync_Entry_Handler
	 */
	protected $entry;

	/**
	 * @param $namespace string
	 * @param $key       string
	 * @param $entry     Data_Sync_Entry_Handler
	 * @param $storage   Storage_Driver
	 */
	public function __construct( $namespace, $key, $entry, $storage ) {
		$this->key     = $key;
		$this->entry   = $entry;
		$this->storage = $storage;
	}

	public function get() {
		// Run `transform` on the value before returning it.
		return $this->entry->transform(
			$this->storage->get( $this->key, $this->entry->get_default_value() )
		);
	}

	public function set( $input ) {

		// 1. Parse the input
		$value = $this->entry->parse( $input );

		// 2. Validate the input
		if ( true !== $this->entry->validate( $value ) ) {
			return $this->entry->get_errors();
		}

		if ( ! empty( $this->storage ) ) {
			// 3. Sanitize and store the value
			$sanitized_value = $this->entry->sanitize( $value );
			return $this->storage->set( $this->key, $sanitized_value );
		}

		return false;
	}

	public function raw_get() {
		return $this->storage->get( $this->key );
	}

	public function raw_set( $value ) {
		return $this->storage->set( $this->key, $value );
	}

	public function delete() {
		return $this->storage->delete( $this->key );
	}

	public function key() {
		return $this->key;
	}

	public function has_errors() {
		return $this->entry->has_errors();
	}

	public function get_errors() {
		return $this->entry->get_errors();
	}

}

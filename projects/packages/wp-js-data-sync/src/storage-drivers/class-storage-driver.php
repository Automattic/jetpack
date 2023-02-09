<?php
/**
 * Entries need to persist data.
 * This interface defines the expected methods,
 * that Data_Sync_Entry will rely on for storage.
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

namespace Automattic\Jetpack\WP_JS_Data_Sync\Storage_Drivers;

interface Storage_Driver {

	/**
	 * Every storage driver should have a namespace.
	 * This ensures that the data is safely stored without
	 * having to repeat the namespace in every key.
	 *
	 * @param $namespace string
	 */
	public function __construct( $namespace );

	/**
	 * Get the stored value by key.
	 *
	 * @param string $key
	 *
	 * @return mixed
	 */
	public function get( $key );

	/**
	 * Set the stored value by key.
	 *
	 * @param string $key
	 * @param mixed  $value
	 *
	 * @return mixed
	 */
	public function set( $key, $value );

	/**
	 * Delete the stored value by key.
	 *
	 * @param string $key Key.
	 *
	 * @return mixed
	 */
	public function delete( $key );
}

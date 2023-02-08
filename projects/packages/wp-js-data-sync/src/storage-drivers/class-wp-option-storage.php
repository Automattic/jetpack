<?php
/**
 * Persist entry data in WordPress Options using this storage driver.
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

// Allow inheriting docblocks using short comment style.
// phpcs:disable Squiz.Commenting.FunctionComment.WrongStyle

namespace Automattic\Jetpack\WP_JS_Data_Sync\Storage_Drivers;

class WP_Option_Storage implements Storage_Driver {

	/* @inheritdoc */
	public function __construct( $namepsace ) {
		$this->namespace = $namepsace;
	}

	/* @inheritdoc */
	public function get( $key, $default = false ) {
		return get_option( $this->key( $key ), $default );
	}

	/* @inheritdoc */
	public function set( $key, $value ) {
		return update_option( $this->key( $key ), $value );
	}

	/* @inheritdoc */
	public function delete( $key ) {
		return delete_option( $this->key( $key ) );
	}

	public function key( $key ) {
		return $this->namespace . '_' . $key;
	}
}

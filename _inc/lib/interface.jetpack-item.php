<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * @package Jetpack
 */

/**
 * Interface iJetpack_Item
 * Defines the what the interface of Jetpack Items should look like so that other classes can start to use it.
 */
interface iJetpack_Item {
	/**
	 * iJetpack_Item constructor.
	 *
	 * @param $name
	 * @param $args
	 */
	function __construct( $name, $args );

	/**
	 * @return string
	 */
	public function name();

	/**
	 * @return array
	 */
	public function get();

}

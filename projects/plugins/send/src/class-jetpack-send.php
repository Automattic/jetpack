<?php
/**
 * Primary class file for the Jetpack Send plugin.
 *
 * @package automattic/jetpack-send-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Send\Send;

/**
 * Thin wrapper that initializes the send package.
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_Send {

	/**
	 * Constructor.
	 */
	public function __construct() {
		Send::init();
	}

	/**
	 * Uninstall hook: remove Send's options and log table.
	 *
	 * @return void
	 */
	public static function uninstall() {
		Send::uninstall();
	}
}

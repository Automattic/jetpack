<?php
/**
 * Spy WooCommerce logger recording log() calls for Debug_Logger assertions.
 *
 * Implements the full WC_Logger_Interface surface (Phan resolves the real interface
 * from the WooCommerce stubs); only log() is used by the code under test.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use WC_Logger_Interface;

// phpcs:disable Squiz.Commenting.FunctionComment.Missing, Generic.Commenting.DocComment.MissingShort, WordPress.WP.AlternativeFunctions

/**
 * Records log() calls; all other WC_Logger_Interface methods are inert no-ops.
 */
class Spy_WC_Logger implements WC_Logger_Interface {

	/**
	 * Captured log() calls.
	 *
	 * @var array[]
	 */
	public $calls = array();

	public function log( $level, $message, $context = array() ) {
		$this->calls[] = array(
			'level'   => $level,
			'message' => $message,
			'context' => $context,
		);
	}

	public function add( $handle, $message, $level = 'notice' ) {
		return true;
	}
	public function debug( $message, $context = array() ) {}
	public function info( $message, $context = array() ) {}
	public function notice( $message, $context = array() ) {}
	public function warning( $message, $context = array() ) {}
	public function error( $message, $context = array() ) {}
	public function critical( $message, $context = array() ) {}
	public function alert( $message, $context = array() ) {}
	public function emergency( $message, $context = array() ) {}
}

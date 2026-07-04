<?php
/**
 * Minimal WooCommerce stubs for the CSV export tests.
 *
 * The package's PHPUnit env is WorDBless (no WooCommerce). These stubs provide just
 * enough of WooCommerce for the export classes to load and be exercised. They are
 * required from tests/php/bootstrap.php before Test_Environment::init(), and are
 * excluded from Phan (see .phan/config.php) so they don't clash with the WooCommerce
 * stubs Phan already loads.
 *
 * @package automattic/jetpack-premium-analytics
 */

// phpcs:disable Squiz.Commenting, Generic.Commenting, WordPress.NamingConventions.ValidFunctionName, WordPress.Files.FileName, PHPCompatibility.Classes.NewTypedProperties, Generic.Files.OneObjectStructurePerFile

if ( ! class_exists( 'WC_REST_Controller' ) ) {
	/**
	 * Stub of WooCommerce's REST controller base class.
	 */
	class WC_REST_Controller extends WP_REST_Controller {}
}

if ( ! class_exists( 'WC_Log_Levels' ) ) {
	/**
	 * Stub of WooCommerce's log-level constants.
	 */
	class WC_Log_Levels {
		const EMERGENCY = 'emergency';
		const ALERT     = 'alert';
		const CRITICAL  = 'critical';
		const ERROR     = 'error';
		const WARNING   = 'warning';
		const NOTICE    = 'notice';
		const INFO      = 'info';
		const DEBUG     = 'debug';
	}
}

if ( ! interface_exists( 'WC_Logger_Interface' ) ) {
	/**
	 * Stub of WooCommerce's logger interface (only the log() method the export code uses).
	 */
	interface WC_Logger_Interface {
		public function log( $level, $message, $context = array() );
	}
}

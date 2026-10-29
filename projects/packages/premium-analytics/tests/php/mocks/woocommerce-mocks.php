<?php
/**
 * Minimal WooCommerce stubs for the CSV export tests.
 *
 * The package's PHPUnit env is WorDBless (no WooCommerce). These stubs provide just
 * enough of WooCommerce for the export classes to load and be exercised. They are
 * required from tests/php/bootstrap.php after Test_Environment::init() (so WordPress
 * base classes exist for the stubs to extend), and are excluded from Phan (see
 * .phan/config.php) so they don't clash with the WooCommerce stubs Phan already loads.
 *
 * @package automattic/jetpack-premium-analytics
 */

// phpcs:disable Squiz.Commenting, Generic.Commenting, WordPress.NamingConventions.ValidFunctionName, WordPress.Files.FileName, PHPCompatibility.Classes.NewTypedProperties, Generic.Files.OneObjectStructurePerFile, Universal.Files.SeparateFunctionsFromOO

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

if ( ! class_exists( 'WC_Email' ) ) {
	/**
	 * Stub of WooCommerce's email base class (enough for CSVExportEmail to load).
	 */
	class WC_Email {
		public $id             = '';
		public $title          = '';
		public $description    = '';
		public $template_html  = '';
		public $template_plain = '';
		public $template_base  = '';
		public $recipient      = '';
		public $sent_args      = null;
		public function __construct() {}
		public function get_option( $key, $default = '' ) {
			return $default;
		}
		public function get_recipient() {
			return $this->recipient;
		}
		public function get_content() {
			return '';
		}
		public function get_headers() {
			return '';
		}
		public function send( $to, $subject, $content, $headers, $attachments = array() ) {
			$this->sent_args = compact( 'to', 'subject', 'attachments' );
			return true;
		}
	}
}

if ( ! function_exists( 'as_enqueue_async_action' ) ) {
	/**
	 * Stub of Action Scheduler's async-action enqueue; returns a fixed action id.
	 */
	function as_enqueue_async_action( $hook, $args = array(), $group = '', $unique = false, $priority = 10 ) {
		$pre = apply_filters( 'pre_as_enqueue_async_action', null, $hook, $args, $group, $priority, $unique );
		if ( null !== $pre ) {
			return is_int( $pre ) ? $pre : 0;
		}

		return 555;
	}
}

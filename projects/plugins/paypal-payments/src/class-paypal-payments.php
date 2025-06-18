<?php
/**
 * Main plugin class.
 *
 * @package automattic/paypal-payments
 */

use Automattic\Jetpack\PaypalPayments\Paypal_NCPS;

/**
 * Class PayPal_Payments
 *
 * @package Automattic\PaypalPayments
 */
class PayPal_Payments {
	/**
	 * Constructor.
	 */
	public function __construct() {
		Paypal_NCPS::register_hooks();
		Paypal_NCPS::register_block();
		Paypal_NCPS::load_editor_styles();
		Paypal_NCPS::load_editor_scripts();
	}

	/**
	 * Deactivation hook.
	 */
	public static function plugin_deactivation() {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				__( 'PayPal Payments plugin deactivated', 'paypal-payments' )
			);
		}
	}
}

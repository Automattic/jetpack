<?php
/**
 * Main plugin class.
 *
 * @package automattic/paypal-payments
 */

use Automattic\Jetpack\PaypalPayments\Paypal_Payment_Buttons;

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
		Paypal_Payment_Buttons::register_hooks();
		Paypal_Payment_Buttons::register_block();
		Paypal_Payment_Buttons::load_editor_styles();
		Paypal_Payment_Buttons::load_editor_scripts();
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

<?php
/**
 * Main plugin class.
 *
 * @package automattic/paypal-payments
 */

use Automattic\Jetpack\PaypalPayments\PayPal_Payment_Buttons;

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
		PayPal_Payment_Buttons::register_hooks();
		PayPal_Payment_Buttons::register_block();
		PayPal_Payment_Buttons::load_editor_styles();
		PayPal_Payment_Buttons::load_editor_scripts();
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

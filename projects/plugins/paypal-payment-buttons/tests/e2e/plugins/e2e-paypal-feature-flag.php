<?php
/**
 * Plugin Name: PayPal Payment Buttons E2E Feature Flag
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Turns on the API-managed buttons flag for the E2E site, and the sandbox flag
 * the wizard's sandbox tests rely on. The suite drives the V2 editor, which
 * the block only shows while the first flag is on.
 *
 * @package automattic/jetpack
 */

add_filter( 'jetpack_feature_flag_enabled_paypal-payments-api-managed-buttons', '__return_true' );
add_filter( 'jetpack_feature_flag_enabled_paypal-payments-sandbox', '__return_true' );

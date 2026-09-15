<?php
/**
 * Plugin Name: PayPal Payment Buttons E2E Feature Flag
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Turns on the API-managed buttons flag for the E2E site. The suite drives the
 * V2 editor, which the block only shows while this flag is on.
 *
 * @package automattic/jetpack
 */

add_filter( 'jetpack_feature_flag_enabled_paypal-payments-api-managed-buttons', '__return_true' );

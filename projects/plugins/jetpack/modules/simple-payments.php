<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Simple Payments module loader.
 *
 * @package automattic/jetpack
 */

require_once __DIR__ . '/../packages/paypal-payments/class-simple-payments.php';

/**
 * Disable direct access and execution.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

Jetpack_Simple_Payments::get_instance();

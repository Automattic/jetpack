<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

// phpcs:disable Universal.Files.SeparateFunctionsFromOO.Mixed -- TODO: Move classes to appropriately-named class files.

use Automattic\Jetpack\Paypal_Payments\Simple_Payments;

// Disable direct access/execution to/of the widget code.
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

add_action( 'widgets_init', array( Simple_Payments::class, 'register_widget_simple_payments' ) );

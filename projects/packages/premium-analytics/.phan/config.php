<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-premium-analytics
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		// WooCommerce stubs for the TEMPORARY interim sync module port (WOOA7S-1550).
		// WooCommerce is a runtime, not composer, dependency; these let Phan resolve WC symbols.
		'+stubs'             => array( 'woocommerce', 'woocommerce-internal' ),
		'exclude_file_regex' => array(
			'build/',
			// Test WooCommerce stubs would redefine the WC symbols the +stubs above provide.
			'tests/php/mocks/',
		),
	)
);

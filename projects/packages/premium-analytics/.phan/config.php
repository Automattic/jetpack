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
		// 'wpcom' also pulls in wpcomsh's wpcom-features files (.phan/config.base.php),
		// which is where wpcom_site_has_feature() is defined — it is not in the
		// generated wpcom stubs.
		'+stubs'             => array( 'woocommerce', 'woocommerce-internal', 'wpcom' ),
		'exclude_file_regex' => array(
			'build/',
			// Test WooCommerce stubs would redefine the WC symbols the +stubs above provide.
			'tests/php/mocks/',
		),
	)
);

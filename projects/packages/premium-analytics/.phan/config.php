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
		// WC stubs resolve WooCommerce symbols for this TEMPORARY interim sync port (WOOA7S-1550);
		// 'wpcom' also pulls in wpcom_site_has_feature(), defined in wpcomsh's wpcom-features files.
		'+stubs'             => array( 'woocommerce', 'woocommerce-internal', 'wpcom' ),
		'exclude_file_regex' => array(
			'build/',
			// Test WooCommerce stubs would redefine the WC symbols the +stubs above provide.
			'tests/php/mocks/',
		),
	)
);

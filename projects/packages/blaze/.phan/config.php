<?php
/**
 * This configuration will be read and overlaid on top of the
 * default configuration. Command-line arguments will be applied
 * after this file is read.
 *
 * @package automattic/jetpack-blaze
 */

// Require base config.
require __DIR__ . '/../../../../.phan/config.base.php';

return make_phan_config(
	dirname( __DIR__ ),
	array(
		'+stubs'            => array( 'woocommerce', 'wpcom' ),
		'exclude_file_list' => array(
			// Testing mocks that override woocommerce stubs.
			'tests/php/mocks/class-wc-product.php',
			'tests/php/mocks/woocommerce-functions.php',
		),
	)
);

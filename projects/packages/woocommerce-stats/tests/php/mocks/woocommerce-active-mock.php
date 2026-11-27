<?php
/**
 * Marks WooCommerce as active for tests of the WooCommerce-only Sync bootstrap.
 *
 * Require it from inside a process-isolated test only, so the class never leaks
 * into tests that assert the no-WooCommerce path.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName

// A test that needs another version defines it before requiring this file.
if ( ! defined( 'WC_VERSION' ) ) {
	define( 'WC_VERSION', '10.0.0' );
}

if ( ! class_exists( 'WooCommerce' ) ) {
	/**
	 * Stub of the WooCommerce main class.
	 */
	class WooCommerce {}
}

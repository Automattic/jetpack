<?php
/**
 * Marks WooCommerce as active for tests of the WooCommerce-only Sync bootstrap.
 *
 * Require it from inside a process-isolated test only, so the class never leaks
 * into tests that assert the no-WooCommerce path.
 *
 * @package automattic/jetpack-premium-analytics
 */

// phpcs:disable WordPress.Files.FileName

if ( ! class_exists( 'WooCommerce' ) ) {
	/**
	 * Stub of the WooCommerce main class.
	 */
	class WooCommerce {}
}

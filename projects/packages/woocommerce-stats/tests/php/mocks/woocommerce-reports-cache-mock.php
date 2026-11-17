<?php
/**
 * Stubs core's report cache, counting invalidations in a global. Require it from a process-isolated test only.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName

namespace Automattic\WooCommerce\Admin\API\Reports;

if ( ! class_exists( Cache::class ) ) {
	/**
	 * Stub of core's report cache.
	 */
	class Cache {

		/**
		 * Count an invalidation.
		 */
		public static function invalidate() {
			$GLOBALS['woocommerce_stats_mock_cache_invalidations'] = ( $GLOBALS['woocommerce_stats_mock_cache_invalidations'] ?? 0 ) + 1;
		}
	}
}

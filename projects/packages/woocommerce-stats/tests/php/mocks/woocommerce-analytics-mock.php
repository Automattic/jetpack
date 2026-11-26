<?php
/**
 * Stubs WooCommerce Analytics for the local report provider: the feature check, on unless
 * `$GLOBALS['woocommerce_stats_mock_analytics_off']`, and the revenue stats controller class.
 * Tests register the route itself.
 *
 * Require it from inside a process-isolated test only, so the classes never leak
 * into tests that assert the no-WooCommerce path.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

// phpcs:disable WordPress.Files.FileName

namespace Automattic\WooCommerce\Utilities;

require_once __DIR__ . '/woocommerce-revenue-stats-controller-mock.php';

if ( ! class_exists( FeaturesUtil::class ) ) {
	/**
	 * Stub of FeaturesUtil.
	 */
	class FeaturesUtil {
		/**
		 * Whether a feature is on.
		 *
		 * @param string $feature_id Feature id.
		 * @return bool
		 */
		public static function feature_is_enabled( string $feature_id ): bool {
			return 'analytics' === $feature_id && empty( $GLOBALS['woocommerce_stats_mock_analytics_off'] );
		}
	}
}

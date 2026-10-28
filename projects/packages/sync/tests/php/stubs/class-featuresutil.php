<?php
/**
 * WooCommerce FeaturesUtil stub.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Utilities;

if ( ! class_exists( FeaturesUtil::class, false ) ) {
	/**
	 * Report features listed in $jetpack_sync_test_features as enabled.
	 */
	class FeaturesUtil {
		/**
		 * Whether a feature is enabled.
		 *
		 * @param string $feature_id Feature ID.
		 * @return bool
		 */
		public static function feature_is_enabled( $feature_id ) {
			global $jetpack_sync_test_features;

			return is_array( $jetpack_sync_test_features ) && in_array( $feature_id, $jetpack_sync_test_features, true );
		}
	}
}

<?php
/**
 * Controllable stand-in for WooCommerce's feature gate, for process-isolated tests only.
 *
 * Inert until a test populates $GLOBALS['jpa_test_wc_features'] (feature id => bool).
 *
 * @package automattic/jetpack-premium-analytics
 */

// phpcs:disable WordPress.Files.FileName, Squiz.Commenting.ClassComment.Missing, Squiz.Commenting.FunctionComment.Missing

namespace Automattic\WooCommerce\Utilities;

if ( ! class_exists( FeaturesUtil::class ) ) {
	class FeaturesUtil {
		public static function feature_is_enabled( $feature ) {
			return ! empty( $GLOBALS['jpa_test_wc_features'][ $feature ] );
		}
	}
}

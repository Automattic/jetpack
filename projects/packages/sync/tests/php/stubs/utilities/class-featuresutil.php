<?php
/**
 * WooCommerce FeaturesUtil stub with every feature enabled.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\WooCommerce\Utilities;

if ( ! class_exists( FeaturesUtil::class, false ) ) {
	/**
	 * WooCommerce FeaturesUtil stub.
	 */
	class FeaturesUtil {
		/**
		 * Whether a feature is enabled.
		 *
		 * @param string $feature_id Feature ID.
		 * @return bool
		 */
		public static function feature_is_enabled( $feature_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return true;
		}
	}
}

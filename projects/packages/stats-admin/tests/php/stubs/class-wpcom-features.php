<?php
/**
 * Stand-in for the WordPress.com feature registry wpcomsh ships, which is not installable here.
 *
 * @package automattic/jetpack-stats-admin
 */

// phpcs:disable Generic.Classes.DuplicateClassName.Found -- each package's test suite needs its own copy, and only one is ever loaded.

if ( ! class_exists( 'WPCOM_Features' ) ) {
	/**
	 * Minimal stand-in for wpcomsh's feature registry.
	 */
	class WPCOM_Features {
		/**
		 * Every feature slug the registry knows.
		 *
		 * @return string[]
		 */
		public static function get_feature_slugs() {
			return array( 'stats-paid', 'stats-commercial' );
		}

		/**
		 * Whether one of the purchases grants the feature.
		 *
		 * @param string $feature   Feature slug.
		 * @param array  $purchases Site purchases.
		 * @param string $site_type Site type, 'wpcom' or 'jetpack'.
		 * @param int    $blog_id   Blog ID.
		 * @return bool
		 */
		public static function has_feature( $feature, $purchases, $site_type = '', $blog_id = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- the signature mirrors wpcomsh's.
			foreach ( $purchases as $purchase ) {
				if ( 'personal-bundle' === $purchase->product_slug && 'stats-paid' === $feature ) {
					return true;
				}
			}
			return false;
		}
	}
}

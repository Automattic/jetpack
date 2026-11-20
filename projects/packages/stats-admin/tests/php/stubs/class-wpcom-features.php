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
			return array( 'stats-paid', 'stats-commercial', 'support' );
		}

		/**
		 * Whether one of the purchases grants the feature.
		 *
		 * @param string $feature   Feature slug.
		 * @param array  $purchases Site purchases.
		 * @param string $site_type Site type, 'wpcom' or 'jetpack'.
		 * @param int    $blog_id   Blog ID.
		 * @throws \Error When handed a blog ID other than the current site's, as wpcomsh's sticker
		 *                lookups do.
		 * @return bool
		 */
		public static function has_feature( $feature, $purchases, $site_type = '', $blog_id = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- the signature mirrors wpcomsh's.
			if ( null !== $blog_id && (int) $blog_id !== WPCOM_TEST_BLOG_ID ) {
				throw new Error( 'Atomic sites cannot resolve stickers for a site other than the current one.' );
			}

			// Granted to every WordPress.com site, purchase or not, as `wpcom-all-sites` features are.
			if ( 'support' === $feature ) {
				return true;
			}

			foreach ( $purchases as $purchase ) {
				if ( 'personal-bundle' === $purchase->product_slug && 'stats-paid' === $feature ) {
					return true;
				}
			}
			return false;
		}
	}
}

if ( ! defined( 'WPCOM_TEST_BLOG_ID' ) ) {
	/**
	 * The WordPress.com blog ID the stubs answer for. Deliberately not 1: on Atomic wpcomsh reads
	 * the ID from `jetpack_options` while WordPress reports 1, and a caller passing the latter is
	 * the bug these stubs exist to catch.
	 */
	define( 'WPCOM_TEST_BLOG_ID', 999 );
}

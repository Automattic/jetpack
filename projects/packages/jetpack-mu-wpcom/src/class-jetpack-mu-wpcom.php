<?php
/**
 * Enhances your site with features powered by WordPress.com
 * This package is intended for internal use on WordPress.com sites only (simple and Atomic).
 * Internal PT Reference: p9dueE-6jY-p2
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack;

/**
 * Jetpack_Mu_Wpcom main class.
 */
class Jetpack_Mu_Wpcom {

	const PACKAGE_VERSION = '0.2.2';
	const PKG_DIR         = __DIR__ . '/../';

	/**
	 * Initialize the class.
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( 'jetpack_mu_wpcom_initialized' ) ) {
			return;
		}

		// Shared code for src/features
		require_once self::PKG_DIR . 'src/common/index.php'; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
		// Todo: once coming-soon is removed from ETK, we can remove the has_action check.
		if ( has_action( 'plugins_loaded', 'A8C\FSE\load_coming_soon' ) === false ) {
			add_action( 'plugins_loaded', array( __CLASS__, 'load_coming_soon' ) );
		}

		/**
		 * Runs right after the Jetpack_Mu_Wpcom package is initialized.
		 *
		 * @since 0.1.2
		 */
		do_action( 'jetpack_mu_wpcom_initialized' );
	}

	/**
	 * Load the Coming Soon feature.
	 */
	public static function load_coming_soon() {
		if (
			( defined( 'WPCOM_PUBLIC_COMING_SOON' ) && WPCOM_PUBLIC_COMING_SOON ) ||
			apply_filters( 'a8c_enable_public_coming_soon', false )
		) {
			require_once __DIR__ . '/features/coming-soon/coming-soon.php';
		}
	}
}

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

	const PACKAGE_VERSION = '0.2.3-alpha';
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

		// Coming Soon feature.
		add_action( 'plugins_loaded', array( __CLASS__, 'load_coming_soon' ) );

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
		/**
		 * On WoA sites, users may be using non-symlinked older versions of the FSE plugin.
		 * If they are, check the active version to avoid redeclaration errors.
		 */
		$invalid_fse_version_active = is_plugin_active( 'full-site-editing/full-site-editing-plugin.php' ) && version_compare( get_plugin_data( WP_PLUGIN_DIR . '/full-site-editing/full-site-editing-plugin.php' )['Version'], '3.56084', '<' );
		if ( $invalid_fse_version_active ) {
			return;
		}

		if (
			( defined( 'WPCOM_PUBLIC_COMING_SOON' ) && WPCOM_PUBLIC_COMING_SOON ) ||
			apply_filters( 'a8c_enable_public_coming_soon', false )
		) {
			require_once __DIR__ . '/features/coming-soon/coming-soon.php';
		}
	}
}

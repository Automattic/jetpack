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

	const PACKAGE_VERSION = '0.1.1-alpha';
	const PKG_DIR         = __DIR__ . '/../';

	/**
	 * Whether this class has been initialized.
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Initialize the class.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			// Shared code for src/features
			require_once self::PKG_DIR . 'src/common/index.php'; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
			// Todo: load the Coming Soon feature.
		}
	}
}

<?php
/**
 * Provides a shared WordPress test environment for Jetpack packages
 *
 * @package automattic/jetpack-test-environment
 */

namespace Automattic\Jetpack;

/**
 * Provides a shared WordPress test environment for Jetpack packages.
 * This ensures WordPress is only loaded once across all packages using this environment.
 */
class Test_Environment {

	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Initialize the shared WordPress test environment.
	 *
	 * This ensures we only load WordPress once across all packages.
	 *
	 * @param string|null $package_slug Optional package slug for custom upload directory.
	 * @throws \RuntimeException If WordPress test environment fails to initialize.
	 */
	public static function init( $package_slug = null ) {
		if ( ! defined( 'WORDBLESS_RUNNING' ) ) {
			// Try the simple path first (works for symlinked/development case)
			$test_env_vendor = dirname( __DIR__, 4 ) . '/tools/php-test-env/vendor/autoload.php';
			if ( ! file_exists( $test_env_vendor ) ) {
				// If simple path fails, search for monorepo root
				$dir      = __DIR__;
				$prev_dir = null;
				while ( $dir !== $prev_dir ) {
					if ( file_exists( $dir . '/tools/php-test-env' ) ) {
						break;
					}
					$prev_dir = $dir;
					$dir      = dirname( $dir );
				}

				if ( ! file_exists( $dir . '/tools/php-test-env' ) ) {
					throw new \RuntimeException( 'Could not locate monorepo root directory' );
				}

				$test_env_vendor = $dir . '/tools/php-test-env/vendor/autoload.php';
			}

			if ( file_exists( $test_env_vendor ) ) {
				require_once $test_env_vendor;
			}

			try {
				if ( ! class_exists( '\WorDBless\Load' ) ) {
					throw new \RuntimeException( 'WorDBless not found. Please ensure automattic/wordbless is installed in tools/php-test-env/composer.json' );
				}

				// If a package slug is provided, use it for a custom upload dir.
				if ( $package_slug && ! defined( 'dbless_UPLOADS' ) ) {
					define( 'dbless_UPLOADS', 'uploads-' . $package_slug ); // phpcs:ignore Generic.NamingConventions.UpperCaseConstantName.ConstantNotUpperCase
				}

				\WorDBless\Load::load();
			} catch ( \Exception $e ) {
				throw new \RuntimeException( 'Failed to initialize WordPress test environment: ' . $e->getMessage() );
			}
		}
	}
}

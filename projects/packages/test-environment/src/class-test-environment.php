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

	const PACKAGE_VERSION = '0.1.5';

	/**
	 * Whether the environment has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Find the test environment autoloader.
	 *
	 * @throws \RuntimeException If the autoloader cannot be found.
	 * @return string Path to the test environment autoloader.
	 */
	public static function find_autoloader() {
		// Try the simple path first (works for symlinked/development case).
		$simple_path = dirname( __DIR__, 4 ) . '/tools/php-test-env/vendor/autoload.php';
		if ( file_exists( $simple_path ) ) {
			return $simple_path;
		}

		// If simple path fails, search recursively for the autoloader.
		$dir = __DIR__;
		while ( ! file_exists( $dir . '/tools/php-test-env/vendor/autoload.php' ) ) {
			$parent = dirname( $dir );
			if ( $parent === $dir ) {
				throw new \RuntimeException( 'Could not locate test environment autoloader' );
			}
			$dir = $parent;
		}
		return $dir . '/tools/php-test-env/vendor/autoload.php';
	}

	/**
	 * Initialize the shared WordPress test environment.
	 *
	 * This ensures we only load WordPress once across all packages.
	 *
	 * @param string|null $package_slug Optional package slug for custom upload directory.
	 * @throws \RuntimeException If WordPress test environment fails to initialize.
	 */
	public static function init( $package_slug = null ) {
		if ( self::$initialized ) {
			return;
		}

		// phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
		require_once self::find_autoloader();

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

		// For various tests using WorDBless, speed things up by reducing the password hashing cost.
		add_filter( 'wp_hash_password_options', array( __CLASS__, 'reduce_password_cost' ) );

		self::$initialized = true;
	}

	/**
	 * Hook for `wp_hash_password_options` to reduce the password hashing cost.
	 *
	 * Since WordPress 6.8, `wp_hash_password` uses PHP's `password_hash`, which has settings that use a lot
	 * of CPU power to hash passwords to make them harder to crack. We don't care about password security for
	 * the dummy users created in tests using WorDBless, so turn it way down to speed up the test runs.
	 *
	 * @param array $options Password options.
	 * @return array Modified options.
	 */
	public static function reduce_password_cost( $options ) {
		$options['cost'] = 4;
		return $options;
	}
}

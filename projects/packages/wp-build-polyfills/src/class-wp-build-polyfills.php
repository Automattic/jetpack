<?php
/**
 * Polyfill registration for Core packages not available in WordPress < 7.0.
 *
 * Conditionally registers wp-private-apis, wp-theme (classic scripts) and
 * `@wordpress/boot`, `@wordpress/route`, `@wordpress/a11y` (script modules)
 * ONLY when they are not already provided by Core or Gutenberg.
 *
 * @package automattic/jetpack-wp-build-polyfills
 */

namespace Automattic\Jetpack\WP_Build_Polyfills;

/**
 * Registers polyfill scripts and modules for WordPress Core packages.
 */
class WP_Build_Polyfills {

	/**
	 * Register polyfill scripts and modules.
	 *
	 * Call this early (e.g. during plugin load) — it hooks into wp_default_scripts
	 * at priority 20 so Core (default) and Gutenberg (priority 10) register first.
	 */
	public static function register() {
		$package_root = dirname( __DIR__ );
		$build_dir    = $package_root . '/build';
		$base_file    = $package_root . '/composer.json';

		add_action(
			'wp_default_scripts',
			function ( $scripts ) use ( $build_dir, $base_file ) {
				self::register_scripts( $scripts, $build_dir, $base_file );
				self::register_modules( $build_dir, $base_file );
			},
			20
		);
	}

	/**
	 * Register polyfill classic scripts.
	 *
	 * @param \WP_Scripts $scripts   The WP_Scripts instance.
	 * @param string      $build_dir Absolute path to the build directory.
	 * @param string      $base_file File path for plugins_url() computation.
	 */
	private static function register_scripts( $scripts, $build_dir, $base_file ) {
		$polyfills = array(
			'wp-notices'      => array(
				'path'  => 'notices',
				// Only force-replace on WP < 7.0: older Core versions ship
				// notices without SnackbarNotices and InlineNotices component
				// exports that @wordpress/boot depends on.
				'force' => version_compare( $GLOBALS['wp_version'] ?? '0', '7.0-dev', '<' ),
			),
			'wp-private-apis' => array(
				'path'  => 'private-apis',
				// Only force-replace on WP < 7.0: older Core versions ship
				// private-apis with an incomplete allowlist that rejects
				// @wordpress/theme and @wordpress/route.
				// Our version is a strict superset (same API, larger allowlist).
				'force' => version_compare( $GLOBALS['wp_version'] ?? '0', '7.0-dev', '<' ),
			),
			'wp-theme'        => array(
				'path' => 'theme',
			),
		);

		foreach ( $polyfills as $handle => $data ) {
			$asset_file = $build_dir . '/scripts/' . $data['path'] . '/index.asset.php';

			if ( ! file_exists( $asset_file ) ) {
				continue;
			}

			$force = ! empty( $data['force'] );

			if ( ! $force && $scripts->query( $handle, 'registered' ) ) {
				continue;
			}

			// Deregister first when forcing replacement of an existing registration.
			if ( $force && $scripts->query( $handle, 'registered' ) ) {
				$scripts->remove( $handle );
			}

			$asset = require $asset_file;

			$scripts->add(
				$handle,
				plugins_url( 'build/scripts/' . $data['path'] . '/index.js', $base_file ),
				$asset['dependencies'],
				$asset['version']
			);
		}
	}

	/**
	 * Register polyfill script modules.
	 *
	 * Call to wp_register_script_module() silently ignores duplicate registrations (first wins),
	 * so no explicit is_registered check is needed.
	 *
	 * @param string $build_dir Absolute path to the build directory.
	 * @param string $base_file File path for plugins_url() computation.
	 */
	private static function register_modules( $build_dir, $base_file ) {
		if ( ! function_exists( 'wp_register_script_module' ) ) {
			return;
		}

		$modules = array( 'boot', 'route', 'a11y' );

		foreach ( $modules as $name ) {
			$module_id  = '@wordpress/' . $name;
			$asset_file = $build_dir . '/modules/' . $name . '/index.asset.php';

			if ( ! file_exists( $asset_file ) ) {
				continue;
			}

			$asset = require $asset_file;

			wp_register_script_module(
				$module_id,
				plugins_url( 'build/modules/' . $name . '/index.js', $base_file ),
				$asset['module_dependencies'] ?? array(),
				$asset['version']
			);
		}
	}
}

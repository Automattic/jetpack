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
	 *
	 * @param string $base_dir  Absolute path to directory containing build/polyfills/.
	 * @param string $base_file File path for plugins_url() computation.
	 */
	public static function register( $base_dir, $base_file ) {
		$polyfills_dir = $base_dir . '/build/polyfills';

		add_action(
			'wp_default_scripts',
			function ( $scripts ) use ( $polyfills_dir, $base_file ) {
				self::register_scripts( $scripts, $polyfills_dir, $base_file );
			},
			20
		);

		add_action(
			'wp_default_scripts',
			function () use ( $polyfills_dir, $base_file ) {
				self::register_modules( $polyfills_dir, $base_file );
			},
			20
		);
	}

	/**
	 * Register polyfill classic scripts.
	 *
	 * @param \WP_Scripts $scripts       The WP_Scripts instance.
	 * @param string      $polyfills_dir Absolute path to the polyfills build directory.
	 * @param string      $base_file     File path for plugins_url() computation.
	 */
	private static function register_scripts( $scripts, $polyfills_dir, $base_file ) {
		$polyfills = array(
			'wp-private-apis' => array(
				'path'  => 'private-apis',
				'deps'  => array(),
				// Always replace: older Core versions ship private-apis with an
				// incomplete allowlist that rejects @wordpress/theme and @wordpress/route.
				// Our version is a strict superset (same API, larger allowlist).
				'force' => true,
			),
			'wp-theme'        => array(
				'path' => 'theme',
				'deps' => array( 'wp-element', 'wp-private-apis' ),
			),
		);

		foreach ( $polyfills as $handle => $data ) {
			$asset_file = $polyfills_dir . '/scripts/' . $data['path'] . '/index.min.asset.php';

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
				plugins_url( 'build/polyfills/scripts/' . $data['path'] . '/index.min.js', $base_file ),
				$asset['dependencies'] ?? $data['deps'],
				$asset['version'] ?? false
			);
		}
	}

	/**
	 * Register polyfill script modules.
	 *
	 * Call to wp_register_script_module() silently ignores duplicate registrations (first wins),
	 * so no explicit is_registered check is needed.
	 *
	 * @param string $polyfills_dir Absolute path to the polyfills build directory.
	 * @param string $base_file     File path for plugins_url() computation.
	 */
	private static function register_modules( $polyfills_dir, $base_file ) {
		if ( ! function_exists( 'wp_register_script_module' ) ) {
			return;
		}

		$modules = array( 'boot', 'route', 'a11y' );

		foreach ( $modules as $name ) {
			$module_id  = '@wordpress/' . $name;
			$asset_file = $polyfills_dir . '/modules/' . $name . '/index.min.asset.php';

			if ( ! file_exists( $asset_file ) ) {
				continue;
			}

			$asset = require $asset_file;

			wp_register_script_module(
				$module_id,
				plugins_url( 'build/polyfills/modules/' . $name . '/index.min.js', $base_file ),
				$asset['module_dependencies'] ?? array(),
				$asset['version'] ?? false
			);
		}
	}
}

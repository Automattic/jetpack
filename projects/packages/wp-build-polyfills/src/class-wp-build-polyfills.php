<?php
/**
 * Polyfill registration for Core packages not available in WordPress < 7.0.
 *
 * Conditionally registers wp-notices, wp-private-apis, wp-theme (classic scripts) and
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
	 * Available polyfill handles for classic scripts.
	 */
	const SCRIPT_HANDLES = array( 'wp-notices', 'wp-private-apis', 'wp-theme', 'wp-views' );

	/**
	 * Available polyfill module IDs.
	 */
	const MODULE_IDS = array( '@wordpress/boot', '@wordpress/route', '@wordpress/a11y' );

	/**
	 * Tracks which polyfills have been requested and by which consumers.
	 *
	 * Keys are polyfill handles/module IDs, values are arrays of consumer names.
	 *
	 * @var array<string, string[]>
	 */
	private static $requested = array();

	/**
	 * Whether the wp_default_scripts hook has already been added.
	 *
	 * @var bool
	 */
	private static $hooked = false;

	/**
	 * The WordPress version below which force-replacements are applied.
	 * When multiple consumers call register() with different thresholds,
	 * the highest threshold wins (most conservative approach).
	 *
	 * @var string
	 */
	private static $wp_version_threshold = '7.0';

	/**
	 * Register polyfill scripts and modules.
	 *
	 * Call this early (e.g. during plugin load) — it hooks into wp_default_scripts
	 * at priority 20 so Core (default) and Gutenberg (priority 10) register first.
	 *
	 * When multiple consumers call this method with different thresholds, the
	 * highest threshold wins (most conservative — polyfills active on more versions).
	 *
	 * @param string   $consumer             A unique identifier for the consumer (e.g. plugin slug).
	 * @param string[] $polyfills             List of polyfill handles/module IDs to register.
	 *                                        Use class constants SCRIPT_HANDLES and MODULE_IDS for reference.
	 * @param string   $wp_version_threshold  The WordPress version below which force-replacements
	 *                                        are applied. Defaults to '7.0'.
	 */
	public static function register( $consumer, $polyfills, $wp_version_threshold = '7.0' ) {
		foreach ( $polyfills as $handle ) {
			if ( ! in_array( $handle, self::SCRIPT_HANDLES, true ) && ! in_array( $handle, self::MODULE_IDS, true ) ) {
				continue;
			}
			if ( ! isset( self::$requested[ $handle ] ) ) {
				self::$requested[ $handle ] = array();
			}
			if ( ! in_array( $consumer, self::$requested[ $handle ], true ) ) {
				self::$requested[ $handle ][] = $consumer;
			}
		}

		if ( version_compare( $wp_version_threshold, self::$wp_version_threshold, '>' ) ) {
			self::$wp_version_threshold = $wp_version_threshold;
		}

		if ( self::$hooked ) {
			return;
		}
		self::$hooked = true;

		$package_root = dirname( __DIR__ );
		$build_dir    = $package_root . '/build';
		$base_file    = $package_root . '/composer.json';

		add_action(
			'wp_default_scripts',
			function ( $scripts ) use ( $build_dir, $base_file ) {
				self::register_scripts( $scripts, $build_dir, $base_file, self::$wp_version_threshold );
				self::register_modules( $build_dir, $base_file );
			},
			20
		);
	}

	/**
	 * Get the map of requested polyfills and their consumers.
	 *
	 * @return array<string, string[]> Keys are polyfill handles/module IDs, values are consumer names.
	 */
	public static function get_consumers() {
		return self::$requested;
	}

	/**
	 * Register polyfill classic scripts.
	 *
	 * @param \WP_Scripts $scripts               The WP_Scripts instance.
	 * @param string      $build_dir             Absolute path to the build directory.
	 * @param string      $base_file             File path for plugins_url() computation.
	 * @param string      $wp_version_threshold  WP version below which force-replacements apply.
	 */
	private static function register_scripts( $scripts, $build_dir, $base_file, $wp_version_threshold ) {
		$force_replace = version_compare( $GLOBALS['wp_version'] ?? '0', $wp_version_threshold, '<' );

		$polyfills = array(
			'wp-notices'      => array(
				'path'  => 'notices',
				// Only force-replace on older WP: older Core versions ship
				// notices without SnackbarNotices and InlineNotices component
				// exports that @wordpress/boot depends on.
				'force' => $force_replace,
			),
			'wp-private-apis' => array(
				'path'  => 'private-apis',
				// Only force-replace on older WP: older Core versions ship
				// private-apis with an incomplete allowlist that rejects
				// @wordpress/theme and @wordpress/route.
				// Our version is a strict superset (same API, larger allowlist).
				'force' => $force_replace,
			),
			'wp-theme'        => array(
				'path' => 'theme',
			),
			'wp-views'        => array(
				'path' => 'views',
			),
		);

		foreach ( $polyfills as $handle => $data ) {
			if ( ! isset( self::$requested[ $handle ] ) ) {
				continue;
			}

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
			$module_id = '@wordpress/' . $name;

			if ( ! isset( self::$requested[ $module_id ] ) ) {
				continue;
			}

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

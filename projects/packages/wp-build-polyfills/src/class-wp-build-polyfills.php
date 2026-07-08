<?php
/**
 * Polyfill registration for Core packages not available or incomplete in older WordPress versions.
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
	 * Minimum Gutenberg plugin version known to ship a private-apis allowlist
	 * that includes the dashboard packages used by this package's current build.
	 */
	const GUTENBERG_PRIVATE_APIS_MIN_VERSION = '23.5.0';

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

		// `wp_default_scripts` fires once when the WP_Scripts singleton is
		// instantiated. If something has already initialized `wp_scripts()` —
		// common on admin requests where WP or other plugins register scripts
		// before `admin_menu` priority 1 runs — adding this hook here is too
		// late and the polyfills never register. Detect that case and run the
		// registration synchronously so consumers can rely on the script
		// handles and module IDs being available regardless of init order.
		if ( did_action( 'wp_default_scripts' ) ) {
			self::register_scripts( wp_scripts(), $build_dir, $base_file, self::$wp_version_threshold );
			self::register_modules( $build_dir, $base_file );
			return;
		}

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
		// Force-replace only when Core's bundled scripts are incomplete and
		// Gutenberg cannot be trusted to provide a compatible implementation.
		$gutenberg_version = defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : null;

		$polyfills = array(
			'wp-notices'      => array(
				'path'            => 'notices',
				'force_threshold' => '7.0',
				// Only force-replace on older WP without Gutenberg: older Core
				// versions ship notices without SnackbarNotices and InlineNotices
				// component exports that @wordpress/boot depends on.
			),
			'wp-private-apis' => array(
				'path'                  => 'private-apis',
				'force_threshold'       => '7.1',
				'gutenberg_min_version' => self::GUTENBERG_PRIVATE_APIS_MIN_VERSION,
				// WP 7.0 and older versions ship private-apis with an incomplete
				// allowlist that rejects @wordpress/theme, @wordpress/route, and
				// newer dashboard packages. Active Gutenberg is only a safe
				// substitute once its private-apis allowlist includes those
				// dashboard packages too.
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

			$force_threshold = $data['force_threshold'] ?? null;
			if ( null !== $force_threshold && version_compare( $wp_version_threshold, $force_threshold, '>' ) ) {
				$force_threshold = $wp_version_threshold;
			}

			$force = null !== $force_threshold
				&& ! self::is_gutenberg_version_safe( $data['gutenberg_min_version'] ?? null, $gutenberg_version )
				&& version_compare( $GLOBALS['wp_version'] ?? '0', $force_threshold, '<' );

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
	 * Check whether the active Gutenberg plugin can satisfy a forced script.
	 *
	 * @param string|null $minimum_version   Minimum Gutenberg version required for the script, or null when any active Gutenberg is sufficient.
	 * @param string|null $gutenberg_version Active Gutenberg version, or null when Gutenberg is inactive.
	 * @return bool True when Gutenberg is active and new enough.
	 */
	private static function is_gutenberg_version_safe( $minimum_version, $gutenberg_version ) {
		if ( null === $gutenberg_version ) {
			return false;
		}

		if ( null === $minimum_version ) {
			return true;
		}

		return version_compare( $gutenberg_version, $minimum_version, '>=' );
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

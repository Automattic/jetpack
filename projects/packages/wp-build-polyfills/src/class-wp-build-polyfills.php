<?php
/**
 * Polyfill registration for Core packages not available or incomplete in older WordPress versions.
 *
 * Conditionally registers wp-notices, wp-private-apis, wp-theme (classic scripts) and
 * `@wordpress/boot`, `@wordpress/route`, `@wordpress/a11y`, `@wordpress/widget-primitives`
 * (script modules) ONLY when they are not already provided by Core or Gutenberg.
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
	const SCRIPT_HANDLES = array( 'wp-notices', 'wp-private-apis', 'wp-rich-text', 'wp-theme', 'wp-views' );

	/**
	 * Available polyfill module IDs.
	 */
	const MODULE_IDS = array( '@wordpress/boot', '@wordpress/route', '@wordpress/a11y', '@wordpress/widget-primitives' );

	/**
	 * Polyfills that only work when another polyfill is registered alongside them.
	 *
	 * These bundles call `__dangerousOptInToUnstableAPIsOnlyForCoreModules()` at
	 * module scope, which throws unless the `wp-private-apis` implementation that
	 * actually loads allowlists their package name. Core's allowlist does not:
	 * WP 6.9 omits `@wordpress/rich-text`, `@wordpress/theme` and
	 * `@wordpress/views`, and WP 7.0 still omits `@wordpress/compose` (bundled
	 * into the rich-text polyfill). Requesting one of these without
	 * `wp-private-apis` therefore throws at load time and blanks the page.
	 *
	 * The `wp-private-apis` script dependency in each `.asset.php` is not enough
	 * on its own — it makes WordPress enqueue the *handle*, which resolves to
	 * Core's incomplete implementation unless the polyfill was requested too.
	 *
	 * @var array<string, string[]>
	 */
	const SCRIPT_DEPENDENCIES = array(
		'wp-rich-text' => array( 'wp-private-apis' ),
		'wp-theme'     => array( 'wp-private-apis' ),
		'wp-views'     => array( 'wp-private-apis' ),
	);

	/**
	 * Minimum Gutenberg plugin version known to ship a private-apis allowlist
	 * that includes the dashboard packages used by this package's current build.
	 */
	const GUTENBERG_PRIVATE_APIS_MIN_VERSION = '23.5.0';

	/**
	 * Minimum Gutenberg plugin version whose rich-text ships all the privateApis
	 * keys dashboard packages unlock (useRichText, KeyboardShortcutContext,
	 * InputEventContext, shortcutsListener, inputEventsListener). They were
	 * completed by Gutenberg PR #78471, first released in 23.6.0 — verified
	 * against the released builds: 23.5.0 lacks three of the five keys.
	 */
	const GUTENBERG_RICH_TEXT_MIN_VERSION = '23.6.0';

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
	 * Polyfills listed in SCRIPT_DEPENDENCIES pull in their companion polyfill
	 * automatically, so consumers cannot request a combination that throws at
	 * load time. Those companions show up in get_consumers() under the
	 * requesting consumer's name.
	 *
	 * Every call also arms WP_Build_Admin_Frame for the request, so the boot
	 * single-page backdrop follows the wp-admin menu color on every wp-build page.
	 *
	 * @param string   $consumer             A unique identifier for the consumer (e.g. plugin slug).
	 * @param string[] $polyfills             List of polyfill handles/module IDs to register.
	 *                                        Use class constants SCRIPT_HANDLES and MODULE_IDS for reference.
	 * @param string   $wp_version_threshold  The WordPress version below which force-replacements
	 *                                        are applied. Defaults to '7.0'.
	 */
	public static function register( $consumer, $polyfills, $wp_version_threshold = '7.0' ) {
		WP_Build_Admin_Frame::register();

		foreach ( $polyfills as $handle ) {
			if ( ! in_array( $handle, self::SCRIPT_HANDLES, true ) && ! in_array( $handle, self::MODULE_IDS, true ) ) {
				continue;
			}

			$required = array_merge( array( $handle ), self::SCRIPT_DEPENDENCIES[ $handle ] ?? array() );

			foreach ( $required as $required_handle ) {
				if ( ! isset( self::$requested[ $required_handle ] ) ) {
					self::$requested[ $required_handle ] = array();
				}
				if ( ! in_array( $consumer, self::$requested[ $required_handle ], true ) ) {
					self::$requested[ $required_handle ][] = $consumer;
				}
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
			'wp-rich-text'    => array(
				'path'                  => 'rich-text',
				'force_threshold'       => '7.1',
				'gutenberg_min_version' => self::GUTENBERG_RICH_TEXT_MIN_VERSION,
				// WP 7.0 and older ship a rich-text whose `privateApis` current
				// dashboard dependencies cannot use (e.g. @wordpress/dataviews
				// >= 17.2 dataform controls, which unlock it at module scope).
				// WP 6.9 exports no `privateApis` at all, which throws "Cannot
				// unlock an undefined object"; WP 7.0 exports one locked with
				// only `useRichText`, so destructuring the other keys yields
				// undefined. Either way the page blanks. Older Gutenberg is not
				// a safe substitute either — see the constant's doc.
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
			// `remove()` drops everything Core set up alongside the src — notably
			// `$args` (Core registers package scripts with `1`, i.e. in the footer)
			// and the registered translations. Both are restored after `add()` so
			// the replacement is a drop-in for the registration it displaces.
			$replaced = null;
			if ( $force && $scripts->query( $handle, 'registered' ) ) {
				$replaced = $scripts->registered[ $handle ];
				$scripts->remove( $handle );
			}

			$asset = require $asset_file;

			$scripts->add(
				$handle,
				plugins_url( 'build/scripts/' . $data['path'] . '/index.js', $base_file ),
				$asset['dependencies'],
				$asset['version'],
				// Match Core's `wp_default_packages_scripts()`, which registers every
				// `wp-*` package script in the footer.
				null !== $replaced ? $replaced->args : 1
			);

			if ( null !== $replaced && null !== $replaced->textdomain ) {
				$scripts->set_translations( $handle, $replaced->textdomain, $replaced->translations_path );
			} elseif ( in_array( 'wp-i18n', $asset['dependencies'], true ) ) {
				// Same rule Core applies when registering its own package scripts.
				// Translations resolve via `{locale}-{handle}.json`, which is keyed
				// by handle, so the polyfill's own src path does not break the lookup.
				$scripts->set_translations( $handle );
			}
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

		$modules = array( 'boot', 'route', 'a11y', 'widget-primitives' );

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

<?php
/**
 * Loads the Jetpack plugin's wp-build output for one admin page.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Loads `build/build.php` for the admin page that renders a wp-build route.
 *
 * @since $$next-version$$
 */
class Jetpack_WP_Build_Page {

	/**
	 * The route page id the screen ID is aliased to.
	 *
	 * @var string|null
	 */
	private static $page_id = null;

	/**
	 * The screen ID alias_screen_id() replaced, until it is restored.
	 *
	 * @var string|null
	 */
	private static $original_screen_id = null;

	/**
	 * Load wp-build for one page. Call it at `admin_menu` priority 1, and only on that page's request.
	 *
	 * Scoped to the page so WP_Build_Polyfills does not replace core scripts everywhere else.
	 *
	 * @param string $page_id The route's page id. It must not be the menu slug: the generated
	 *                        standalone page.php intercepts `admin_init` for its own id and exits.
	 * @return bool Whether the build output exists and can render the page.
	 */
	public static function load( $page_id ) {
		$build_index = JETPACK__PLUGIN_DIR . 'build/build.php';
		if ( ! file_exists( $build_index ) ) {
			return false;
		}

		self::$page_id = $page_id;

		// Hooked on either side of the require, so the alias holds only for the generated
		// enqueue check it registers at the same priority.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'alias_screen_id' ) );
		require_once $build_index;

		// A stale or partial build can't render the page, so don't swap core's scripts for it.
		if ( ! function_exists( 'jetpack_plugin_' . str_replace( '-', '_', $page_id ) . '_wp_admin_render_page' ) ) {
			remove_action( 'admin_enqueue_scripts', array( __CLASS__, 'alias_screen_id' ) );
			self::$page_id = null;
			return false;
		}

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'restore_screen_id' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_i18n_loader' ) );

		// wp-build hooks module registration to wp_default_scripts, which has already fired by
		// admin_menu — call it directly or the init module never reaches the import map.
		if ( function_exists( 'jetpack_plugin_register_script_modules' ) ) {
			jetpack_plugin_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		if ( class_exists( WP_Build_Polyfills::class ) ) {
			WP_Build_Polyfills::register(
				'jetpack',
				array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
			);
		}

		return true;
	}

	/**
	 * Point the screen ID at the wp-build page while its generated enqueue check runs.
	 *
	 * @return void
	 */
	public static function alias_screen_id() {
		$screen = get_current_screen();
		if ( ! $screen || null === self::$page_id ) {
			return;
		}

		self::$original_screen_id = $screen->id;
		$screen->id               = self::$page_id;
	}

	/**
	 * Undo alias_screen_id(), since JITM builds its message path from the screen ID.
	 *
	 * @return void
	 */
	public static function restore_screen_id() {
		$screen = get_current_screen();
		if ( ! $screen || null === self::$original_screen_id ) {
			return;
		}

		$screen->id               = self::$original_screen_id;
		self::$original_screen_id = null;
	}

	/**
	 * Enqueue the JS translation loader the route bundles need.
	 *
	 * Registered on every admin page but only enqueued when depended on, and the esbuild
	 * bundles don't pull it in — without it every string renders untranslated.
	 *
	 * @return void
	 */
	public static function enqueue_i18n_loader() {
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}
}

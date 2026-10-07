<?php
/**
 * Protect dashboard: a wp-build page in the Jetpack sidebar.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Screen_Id;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the Protect sidebar item and renders its wp-build route.
 */
class Dashboard {

	/**
	 * Package version, bumped at release through composer.json `version-constants`.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Sidebar menu slug, shared with the Jetpack Protect plugin so the page address never changes.
	 *
	 * @var string
	 */
	const MENU_SLUG = 'jetpack-protect';

	/**
	 * The wp-build route's page id. It must not be the menu slug: the generated
	 * standalone page.php intercepts `admin_init` for its own id and exits.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_ID = 'jetpack-protect-dashboard';

	/**
	 * Name of the wp-build render function generated for WP_BUILD_PAGE_ID.
	 *
	 * @var string
	 */
	const RENDER_FUNCTION = 'jetpack_protect_jetpack_protect_dashboard_wp_admin_render_page';

	/**
	 * Extra Admin_Menu item options, such as the module that owns the item.
	 *
	 * @var array
	 */
	private static $menu_options = array();

	/**
	 * The screen ID alias_screen_id() replaced, until it is restored.
	 *
	 * @var string|null
	 */
	private static $original_screen_id = null;

	/**
	 * Wire the hooks.
	 *
	 * @param array $menu_options Admin_Menu item options merged over the defaults, e.g. `module`.
	 * @return void
	 */
	public static function init( array $menu_options = array() ) {
		self::$menu_options = $menu_options;

		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
		// Before Admin_Menu registers its items at 1000, and after the Protect plugin adds its own on `_admin_menu`.
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ), 999 );

		/**
		 * Fires once the Protect dashboard has wired its hooks, so the page exists.
		 *
		 * @since $$next-version$$
		 */
		do_action( 'jetpack_protect_dashboard_initialized' );
	}

	/**
	 * Load wp-build output, only on this page's request.
	 *
	 * Scoped to the page so WP_Build_Polyfills does not replace core scripts everywhere else.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the page slug only.
		if ( ! isset( $_GET['page'] ) || self::MENU_SLUG !== sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) {
			return;
		}

		$build_index = dirname( __DIR__ ) . '/build/build.php';
		if ( ! file_exists( $build_index ) ) {
			return;
		}

		$load_wp_build = static function () use ( $build_index ) {
			require_once $build_index;
		};

		// Fallback: an older wp-build-polyfills under the jetpack-autoloader may predate load_with_alias().
		if ( method_exists( WP_Build_Screen_Id::class, 'load_with_alias' ) ) {
			WP_Build_Screen_Id::load_with_alias(
				array( __CLASS__, 'alias_screen_id' ),
				array( __CLASS__, 'restore_screen_id' ),
				$load_wp_build
			);
		} else {
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'alias_screen_id' ) );
			$load_wp_build();
			add_action( 'admin_enqueue_scripts', array( __CLASS__, 'restore_screen_id' ) );
		}

		// A stale or partial build can't render the page, so don't swap core's scripts for it.
		if ( ! function_exists( self::RENDER_FUNCTION ) ) {
			return;
		}

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_i18n_loader' ) );

		// wp-build hooks module registration to wp_default_scripts, which has already fired by
		// admin_menu — call it directly or the init module never reaches the import map.
		if ( function_exists( 'jetpack_protect_register_script_modules' ) ) {
			jetpack_protect_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		WP_Build_Polyfills::register(
			'jetpack-protect',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);
	}

	/**
	 * Point the screen ID at the wp-build page while its generated enqueue check runs.
	 *
	 * @return void
	 */
	public static function alias_screen_id() {
		$screen = get_current_screen();
		if ( ! $screen ) {
			return;
		}

		self::$original_screen_id = $screen->id;
		$screen->id               = self::WP_BUILD_PAGE_ID;
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
	 * Enqueue the JS translation loader, which the esbuild route bundles don't pull in.
	 *
	 * @return void
	 */
	public static function enqueue_i18n_loader() {
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}

	/**
	 * Add the "Protect" item to the Jetpack sidebar, in place of the Jetpack Protect plugin's.
	 *
	 * @return void
	 */
	public static function add_menu() {
		// Take the slug over from the Jetpack Protect plugin: drop its item and the scripts it loads for that page.
		// The plugin's instance isn't reachable, so this clears every earlier callback on those load hooks, not just its own.
		while ( Admin_Menu::remove_menu( self::MENU_SLUG ) ) {
			continue;
		}
		remove_all_actions( 'load-jetpack_page_' . self::MENU_SLUG );
		remove_all_actions( 'load-admin_page_' . self::MENU_SLUG );

		Admin_Menu::add_menu(
			// "Protect" is a product name and is not translated.
			'Protect',
			'Protect',
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'render' ),
			null,
			array_merge( array( 'key' => self::MENU_SLUG ), self::$menu_options )
		);
	}

	/**
	 * Render the wp-build page, or say why it could not be rendered.
	 *
	 * @return void
	 */
	public static function render() {
		$render_fn = self::RENDER_FUNCTION;
		if ( function_exists( $render_fn ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunctionInCallable -- Checked with function_exists(); defined in the generated build/, which Phan excludes.
			$render_fn();
			return;
		}

		printf(
			'<div class="wrap"><h1>Protect</h1><div class="notice notice-error"><p>%s</p></div></div>',
			esc_html__( 'The Protect dashboard could not be loaded because its assets are missing.', 'jetpack-protect-pkg' )
		);
	}
}

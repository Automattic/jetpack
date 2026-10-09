<?php
/**
 * Protect dashboard: a wp-build page in the Jetpack sidebar.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Protect_Status\Plan;
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
	 * Registered sections, keyed by section key.
	 *
	 * @var Dashboard_Section[]
	 */
	private static $sections = array();

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
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );

		self::load_sections( __DIR__ . '/sections' );

		/**
		 * Fires once the Protect dashboard has wired its hooks, so the page exists.
		 *
		 * @since $$next-version$$
		 */
		do_action( 'jetpack_protect_dashboard_initialized' );
	}

	/**
	 * Register the section class each `class-<name>.php` file in a folder declares.
	 *
	 * Each feature lives in its own file, so features can land independently. The class for
	 * `class-login-protection.php` is `Sections\Login_Protection`; the file must have no side effects,
	 * since the classmap autoloader can also load it.
	 *
	 * @param string $dir Folder holding the section files.
	 * @return void
	 */
	public static function load_sections( $dir ) {
		$files = glob( $dir . '/class-*.php' );
		foreach ( is_array( $files ) ? $files : array() as $file ) {
			$name  = str_replace( ' ', '_', ucwords( str_replace( '-', ' ', substr( basename( $file, '.php' ), 6 ) ) ) );
			$class = __NAMESPACE__ . '\\Sections\\' . $name;
			if ( ! class_exists( $class ) ) {
				require_once $file;
			}
			if ( ! is_subclass_of( $class, Dashboard_Section::class ) || self::has_section_of_class( $class ) ) {
				continue;
			}
			self::register_section( new $class() );
		}
	}

	/**
	 * Whether a section of the given class is already registered, so init() can run twice.
	 *
	 * @param string $class Section class name.
	 * @return bool
	 */
	private static function has_section_of_class( $class ) {
		foreach ( self::$sections as $section ) {
			if ( $section instanceof $class ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Add a section to the dashboard.
	 *
	 * @param Dashboard_Section $section The section.
	 * @return void
	 */
	public static function register_section( Dashboard_Section $section ) {
		$key = $section->get_key();
		if ( isset( self::$sections[ $key ] ) ) {
			/* translators: %s is a dashboard section key. */
			$message = sprintf( __( 'A Protect dashboard section with the key "%s" is already registered.', 'jetpack-protect-pkg' ), $key );
			_doing_it_wrong( __METHOD__, esc_html( $message ), '$$next-version$$' );
			return;
		}
		self::$sections[ $key ] = $section;
	}

	/**
	 * Register every section's REST routes.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		foreach ( self::$sections as $section ) {
			$section->register_routes();
		}
	}

	/**
	 * Each section's state, keyed by section key.
	 *
	 * @return array
	 */
	public static function get_initial_state() {
		$state = array();
		foreach ( self::$sections as $key => $section ) {
			$state[ $key ] = $section->get_state();
		}
		return $state;
	}

	/**
	 * Print each section's state as `window.jetpackProtectDashboard`, for the page's scripts.
	 *
	 * @return void
	 */
	public static function print_initial_state() {
		$state = wp_json_encode( (object) self::get_initial_state(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP );
		wp_print_inline_script_tag( 'window.jetpackProtectDashboard = ' . ( false === $state ? '{}' : $state ) . ';' );
	}

	/**
	 * Whether the current user may see and use the dashboard's REST routes.
	 *
	 * @return bool
	 */
	public static function can_manage() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Whether the site has a plan that includes Scan.
	 *
	 * @return bool
	 */
	public static function has_scan_plan() {
		return Plan::has_required_plan();
	}

	/**
	 * Whether a module can run on this site, and whether it is on.
	 *
	 * @param string $module Module slug.
	 * @return array
	 */
	public static function get_module_state( $module ) {
		$modules = new Modules();

		return array(
			'available' => $modules->is_module( $module ),
			'active'    => $modules->is_active( $module ),
		);
	}

	/**
	 * Load wp-build output, only on this page's request.
	 *
	 * Scoped to the page so WP_Build_Polyfills does not replace core scripts everywhere else.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_dashboard_request() ) {
			return;
		}

		self::load_wp_build( dirname( __DIR__ ) . '/build/build.php' );
	}

	/**
	 * Whether the request is for the dashboard's page.
	 *
	 * @return bool
	 */
	public static function is_dashboard_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the page slug only.
		return isset( $_GET['page'] ) && self::MENU_SLUG === sanitize_text_field( wp_unslash( $_GET['page'] ) );
	}

	/**
	 * Load a wp-build index and, if it can render the page, its scripts and polyfills.
	 *
	 * @param string $build_index Path to the generated build.php.
	 * @return bool Whether the build can render the page.
	 */
	public static function load_wp_build( $build_index ) {
		if ( ! file_exists( $build_index ) ) {
			return false;
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
			return false;
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

		return true;
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
			self::print_initial_state();
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

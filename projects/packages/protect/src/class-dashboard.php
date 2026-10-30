<?php
/**
 * Protect dashboard: a wp-build page in the Jetpack sidebar.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Protect_Status\Plan;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;
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
	const PACKAGE_VERSION = '0.4.0';

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
	 * The settings section that owns each Jetpack security module, for links from other screens.
	 *
	 * @since 0.3.0
	 *
	 * @var array<string, string>
	 */
	const MODULE_SECTIONS = array(
		'waf'                => 'firewall',
		'protect'            => 'loginProtection',
		'account-protection' => 'loginProtection',
		'sso'                => 'loginProtection',
		'monitor'            => 'monitor',
	);

	/**
	 * The Jetpack filter that sets a module's Configure link, minus the module slug.
	 *
	 * @var string
	 */
	const CONFIGURATION_URL_FILTER = 'jetpack_module_configuration_url_';

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

		add_action( 'admin_init', array( __CLASS__, 'maybe_redirect_threat_report' ) );
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
		add_action( 'jetpack_wp_admin_spa_load', array( __CLASS__, 'load_wp_build_for_spa' ) );
		add_filter( 'jetpack_wp_admin_spa_menu_routes', array( __CLASS__, 'add_spa_menu_route' ) );
		// Before Admin_Menu registers its items at 1000, and after the Protect plugin adds its own on `_admin_menu`.
		add_action( 'admin_menu', array( __CLASS__, 'add_menu' ), 999 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		Threat_Count::init();

		foreach ( array_keys( self::MODULE_SECTIONS ) as $module ) {
			add_filter( self::CONFIGURATION_URL_FILTER . $module, array( __CLASS__, 'filter_module_configuration_url' ) );
			// Firewall and Account protection have no Configure link otherwise.
			add_filter( 'jetpack_module_configurable_' . $module, '__return_true' );
		}

		self::load_sections( __DIR__ . '/sections' );

		/**
		 * Fires once the Protect dashboard has wired its hooks, so the page exists.
		 *
		 * @since 0.1.0
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
			_doing_it_wrong( __METHOD__, esc_html( $message ), '0.1.0' );
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
	 * The Settings tab's URL, scrolled to a section's card.
	 *
	 * @since 0.3.0
	 *
	 * @param string $section Section key, such as `firewall`; empty for the top of the tab.
	 * @return string
	 */
	public static function get_settings_url( $section = '' ) {
		$query = array( 'tab' => 'settings' );
		if ( '' !== $section ) {
			$query['section'] = $section;
		}

		return admin_url( 'admin.php?page=' . self::MENU_SLUG . '&p=' . rawurlencode( '/?' . http_build_query( $query ) ) );
	}

	/**
	 * Each security module's card on the Settings tab, for screens that link here instead of offering the setting.
	 *
	 * @since 0.3.0
	 *
	 * @return array<string, string> Settings URLs keyed by module slug.
	 */
	public static function get_module_settings_urls() {
		return array_map( array( __CLASS__, 'get_settings_url' ), self::MODULE_SECTIONS );
	}

	/**
	 * Point a security module's Configure link at its card on the Settings tab.
	 *
	 * @since 0.3.0
	 *
	 * @param string $url The URL Jetpack would use.
	 * @return string
	 */
	public static function filter_module_configuration_url( $url ) {
		$module = substr( current_filter(), strlen( self::CONFIGURATION_URL_FILTER ) );
		$urls   = self::get_module_settings_urls();

		return $urls[ $module ] ?? $url;
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
	 * Where a site without Scan can buy it.
	 *
	 * @return string
	 */
	public static function get_scan_upgrade_url() {
		/** This filter is documented in projects/packages/my-jetpack/src/class-main-features.php */
		$upgrade = apply_filters(
			'jetpack_feature_upgrade',
			array(
				'path'     => '/add-scan',
				'name'     => 'Jetpack Scan', // Product name, do not translate.
				'back_url' => admin_url( 'admin.php?page=' . self::MENU_SLUG ),
			),
			'protect-dashboard',
			false
		);

		$url = is_array( $upgrade ) ? esc_url_raw( (string) ( $upgrade['url'] ?? '' ) ) : '';

		return $url ? $url : admin_url( 'admin.php?page=my-jetpack#/add-scan' );
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
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_tracks_identity' ), 20 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_tracks_transport' ) );
	}

	/**
	 * Load Protect's wp-build output for the Jetpack plugin's top-level SPA page.
	 *
	 * @see Jetpack_WP_Admin_SPA::maybe_load_wp_build()
	 * @return void
	 */
	public static function load_wp_build_for_spa() {
		$build_index = dirname( __DIR__ ) . '/build/build.php';
		if ( ! self::can_manage() || ! file_exists( $build_index ) ) {
			return;
		}
		require_once $build_index;

		// Declared on the host page only so wp-build emits the routes; the host does the booting.
		remove_action( 'admin_enqueue_scripts', 'jetpack_protect_jetpack_spa_wp_admin_enqueue_scripts' );
		add_filter(
			'jetpack_wp_admin_spa_route_getters',
			function ( $getters ) {
				$getters[] = 'jetpack_protect_get_jetpack_spa_wp_admin_routes';
				return $getters;
			}
		);

		if ( function_exists( 'jetpack_protect_register_script_modules' ) ) {
			jetpack_protect_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		add_action( 'admin_print_scripts', array( __CLASS__, 'print_initial_state' ), 1 );
		add_action( 'admin_print_scripts', array( __CLASS__, 'print_tracks_state' ), 1 );
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_tracks_identity' ), 20 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_tracks_transport' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_i18n_loader' ) );
	}

	/**
	 * Point the Protect sidebar entry at the SPA route, when the build can serve it.
	 *
	 * @param array $routes Menu slug => SPA route path.
	 * @return array
	 */
	public static function add_spa_menu_route( $routes ) {
		if ( file_exists( dirname( __DIR__ ) . '/build/build.php' ) ) {
			$routes[ self::MENU_SLUG ] = '/protect';
		}
		return $routes;
	}

	/**
	 * Load the Tracks script that sends queued events; other packages only load it for some plans.
	 *
	 * @return void
	 */
	public static function enqueue_tracks_transport() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		if ( ! self::can_use_analytics() ) {
			return;
		}

		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
	}

	/**
	 * Add the connected WordPress.com user to the script data, for Tracks, unless another package already did.
	 *
	 * @param array $data The script data.
	 * @return array
	 */
	public static function add_tracks_identity( $data ) {
		if ( ! empty( $data['user']['current_user']['wpcom']['ID'] ) ) {
			return $data;
		}
		$connected = ( new Connection_Manager() )->get_connected_user_data();
		if ( empty( $connected['ID'] ) || empty( $connected['login'] ) ) {
			return $data;
		}
		$data['user']['current_user']['wpcom'] = array_merge(
			$data['user']['current_user']['wpcom'] ?? array(),
			array(
				'ID'    => $connected['ID'],
				'login' => $connected['login'],
			)
		);
		return $data;
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
	 * Send a `&threats=` link, such as a threat email's, to the route that reads it.
	 *
	 * @return void
	 */
	public static function maybe_redirect_threat_report() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only redirects; nothing is changed.
		$redirect = self::is_dashboard_request() ? self::get_threat_report_redirect( wp_unslash( $_GET ) ) : null;
		if ( $redirect ) {
			wp_safe_redirect( $redirect );
			exit( 0 );
		}
	}

	/**
	 * The threat report URL for a request whose top-level `threats` param lists threat ids.
	 *
	 * The wp-build router reads search params only from inside `p`, so links name the ids at the top level instead.
	 *
	 * @since 0.3.0
	 *
	 * @param array $query The request's query args.
	 * @return string|null The URL, or null when the request needs no redirect.
	 */
	public static function get_threat_report_redirect( array $query ) {
		if ( isset( $query['p'] ) || ! isset( $query['threats'] ) || ! is_string( $query['threats'] ) ) {
			return null;
		}
		// Drop any id that isn't all digits, as the client does, rather than merging what's left of it.
		$ids = array_filter( array_map( 'trim', explode( ',', $query['threats'] ) ), 'ctype_digit' );
		if ( ! $ids ) {
			return null;
		}
		return add_query_arg(
			array(
				'page' => self::MENU_SLUG,
				'p'    => rawurlencode( '/?threats=' . implode( ',', $ids ) ),
			),
			admin_url( 'admin.php' )
		);
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
	 * Whether the site and user allow Tracks, as on Jetpack's other admin pages.
	 *
	 * @since 0.3.0
	 *
	 * @return bool
	 */
	public static function can_use_analytics() {
		$tracking = new Tracking( 'jetpack', new Connection_Manager( 'jetpack' ) );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), new Status() );
	}

	/**
	 * Print the flag the page's Tracks client records under, only when Tracks is allowed.
	 *
	 * @since 0.3.0
	 *
	 * @return void
	 */
	public static function print_tracks_state() {
		if ( self::can_use_analytics() ) {
			wp_print_inline_script_tag( 'window.jetpackProtectTracks = true;' );
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

		Threat_Count::register_menu_badge();
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
			self::print_tracks_state();
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

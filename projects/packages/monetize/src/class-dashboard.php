<?php
/**
 * Monetize dashboard: a wp-build page in the Jetpack sidebar.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Partner;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Screen_Id;
use Jetpack_Options;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the Monetize sidebar item and renders its wp-build route.
 */
class Dashboard {

	/**
	 * Package version, bumped at release through composer.json `version-constants`.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.0';

	/**
	 * Feature flag that makes the dashboard available while it is built.
	 *
	 * @var string
	 */
	const FEATURE_FLAG = 'jetpack-monetize-dashboard';

	/**
	 * Sidebar menu slug.
	 *
	 * @var string
	 */
	const MENU_SLUG = 'jetpack-monetize';

	/**
	 * The wp-build route's page id. It must not be the menu slug: the generated
	 * standalone page.php intercepts `admin_init` for its own id and exits.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_ID = 'jetpack-monetize-dashboard';

	/**
	 * Name of the wp-build render function generated for WP_BUILD_PAGE_ID.
	 *
	 * @var string
	 */
	const RENDER_FUNCTION = 'jetpack_monetize_jetpack_monetize_dashboard_wp_admin_render_page';

	/**
	 * The slug the `jetpack_feature_upgrade` filter sees for this page's upgrade links.
	 *
	 * @var string
	 */
	const UPGRADE_SLUG = 'monetize-dashboard';

	/**
	 * The dashboard's sections.
	 *
	 * @var string[]
	 */
	const SECTIONS = array(
		Sections\Overview::class,
		Sections\Payments::class,
		Sections\Ads::class,
	);

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
	 * Register the flag. Hosts call this before they decide whether to load the dashboard.
	 *
	 * @return void
	 */
	public static function register_feature_flag() {
		Feature_Flags::register(
			self::FEATURE_FLAG,
			array(
				'default'     => false,
				'description' => 'Make the Monetize dashboard available while it is built.',
				'owner'       => 'jetpack',
			)
		);
	}

	/**
	 * Whether the dashboard's feature flag is on.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return Feature_Flags::is_enabled( self::FEATURE_FLAG );
	}

	/**
	 * Wire the hooks.
	 *
	 * @param array $menu_options Admin_Menu item options merged over the defaults, e.g. `module`.
	 * @return void
	 */
	public static function init( array $menu_options = array() ) {
		self::$menu_options = $menu_options;

		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );

		// A wpcom host adds the item itself: see README.
		if ( ! ( new Host() )->is_wpcom_platform() ) {
			// Before Admin_Menu registers its items at 1000.
			add_action( 'admin_menu', array( __CLASS__, 'add_menu' ), 999 );
		}

		// Simple reaches WordPress.com directly, so it needs none of the forwarding routes.
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
		}

		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ) );
		add_action( 'admin_enqueue_scripts', array( Tracks::class, 'enqueue_transport' ) );

		self::register_sections();
	}

	/**
	 * Register each of SECTIONS, skipping keys already registered so init() can run twice.
	 *
	 * @return void
	 */
	private static function register_sections() {
		foreach ( self::SECTIONS as $class ) {
			$section = new $class();
			if ( ! isset( self::$sections[ $section->get_key() ] ) ) {
				self::register_section( $section );
			}
		}
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
			$message = sprintf( __( 'A Monetize dashboard section with the key "%s" is already registered.', 'jetpack-monetize' ), $key );
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
	 * Whether the current user may see the dashboard and use its REST routes.
	 *
	 * @return bool
	 */
	public static function can_manage() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Each section's state, keyed by section key.
	 *
	 * @return object[]
	 */
	public static function get_initial_state() {
		$state = array();
		foreach ( self::$sections as $key => $section ) {
			// An empty array would print as `[]`, and the page reads every section's state as an object.
			$state[ $key ] = (object) $section->get_state();
		}
		return $state;
	}

	/**
	 * Add the page's data to `JetpackScriptData.monetize` on the dashboard's page: each section's state, and what every tab shares.
	 *
	 * @param array $data Script data.
	 * @return array
	 */
	public static function add_script_data( $data ) {
		if ( ! self::is_dashboard_request() ) {
			return $data;
		}

		$data['monetize']['sections']   = (object) self::get_initial_state();
		$data['monetize']['upgradeUrl'] = self::get_upgrade_url();
		$data['monetize']['tracks']     = Tracks::is_allowed();

		return Tracks::add_identity( $data );
	}

	/**
	 * Where the page's upgrade links go: Jetpack Creator, unless a host sends them to its own plans.
	 *
	 * @since $$next-version$$
	 *
	 * @return string
	 */
	public static function get_upgrade_url() {
		/** This filter is documented in projects/packages/my-jetpack/src/class-main-features.php */
		$upgrade = apply_filters(
			'jetpack_feature_upgrade',
			array(
				'path'     => '',
				'name'     => 'Jetpack Creator', // Product name, do not translate.
				'back_url' => admin_url( 'admin.php?page=' . self::MENU_SLUG ),
			),
			self::UPGRADE_SLUG,
			false
		);

		$url = is_array( $upgrade ) ? esc_url_raw( (string) ( $upgrade['url'] ?? '' ) ) : '';

		return $url ? $url : self::get_jetpack_creator_url();
	}

	/**
	 * Jetpack Creator's checkout, with the arguments Jetpack's other upgrade links carry.
	 *
	 * @return string
	 */
	private static function get_jetpack_creator_url() {
		$connection = new Connection_Manager();
		$blog_id    = Jetpack_Options::get_option( 'id' );
		$partner    = Partner::init();

		$query = $connection->is_user_connected() ? '' : 'unlinked=1&';
		// Lets an admin of a site with no connected user buy without a WordPress.com account.
		if ( $connection->is_site_connection() && current_user_can( 'manage_options' ) ) {
			$query .= 'purchasetoken=' . self::get_purchase_token();
		}

		return Redirect::get_url(
			'jetpack-creator-cta',
			array(
				'site'         => $blog_id ? (string) $blog_id : ( new Status() )->get_site_suffix(),
				'aff'          => $partner->get_partner_code( Partner::AFFILIATE_CODE ),
				'u'            => (string) get_current_user_id(),
				'subsidiaryId' => $partner->get_partner_code( Partner::SUBSIDIARY_CODE ),
				'query'        => $query,
				'calypso_env'  => ( new Host() )->get_calypso_env(),
			)
		);
	}

	/**
	 * The site's token for buying without a WordPress.com account, created on first use.
	 *
	 * @return string
	 */
	private static function get_purchase_token() {
		$token = Jetpack_Options::get_option( 'purchase_token' );
		if ( ! $token ) {
			$token = wp_generate_password( 12, false );
			Jetpack_Options::update_option( 'purchase_token', $token, true );
		}
		return (string) $token;
	}

	/**
	 * Load wp-build output, only on this page's request.
	 *
	 * Scoped to the page so WP_Build_Polyfills does not replace core scripts everywhere else.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( self::is_dashboard_request() ) {
			self::load_wp_build( dirname( __DIR__ ) . '/build/build.php' );
		}
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
	 * The admin URL that opens one of the dashboard's tabs.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $tab The tab's `?tab=` value; 'overview' opens the bare page.
	 * @return string
	 */
	public static function get_tab_url( $tab ) {
		$path = 'admin.php?page=' . self::MENU_SLUG;
		if ( 'overview' !== $tab ) {
			// wp-build's router reads a route's search params from `p`.
			$path .= '&p=' . rawurlencode( '/?tab=' . $tab );
		}
		return admin_url( $path );
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
		if ( function_exists( 'jetpack_monetize_register_script_modules' ) ) {
			jetpack_monetize_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		WP_Build_Polyfills::register(
			'jetpack-monetize',
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
	 * Add the "Monetize" item to the Jetpack sidebar.
	 *
	 * @return void
	 */
	public static function add_menu() {
		Admin_Menu::add_menu(
			__( 'Monetize', 'jetpack-monetize' ),
			__( 'Monetize', 'jetpack-monetize' ),
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'render' ),
			null,
			array_merge( array( 'key' => self::MENU_SLUG ), self::$menu_options )
		);
	}

	/**
	 * Add the "Monetize" item under the Jetpack menu on Simple, once wpcom-admin-menu.php has built that menu.
	 *
	 * @return void
	 */
	public static function add_wp_admin_submenu() {
		add_submenu_page(
			'jetpack',
			__( 'Monetize', 'jetpack-monetize' ),
			__( 'Monetize', 'jetpack-monetize' ),
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'render' )
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
			$render_fn();
			return;
		}

		printf(
			'<div class="wrap"><h1>%s</h1><div class="notice notice-error"><p>%s</p></div></div>',
			esc_html__( 'Monetize', 'jetpack-monetize' ),
			esc_html__( 'The Monetize dashboard could not be loaded because its assets are missing.', 'jetpack-monetize' )
		);
	}
}

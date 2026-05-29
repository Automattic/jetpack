<?php
/**
 * Jetpack SEO — the visibility command center for WordPress sites.
 *
 * Registers the `admin.php?page=jetpack-seo` screen via Admin_Menu so it is
 * reachable on self-hosted, Atomic/WoW, and Simple sites alike. Everything
 * else plugs into it — REST endpoints, the React SPA, the editor sidebar.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host as Status_Host;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Readonly;
use Jetpack_SEO_Utils;

/**
 * The main Initializer class that registers the admin menu and enqueues the assets.
 */
class Initializer {

	/**
	 * Jetpack SEO package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Menu slug for the admin page.
	 */
	const MENU_SLUG = 'jetpack-seo';

	/**
	 * Data-sync namespace. Also the name of the window global the registry
	 * bootstraps onto the page (`window.jetpack_seo`); must match the JS-side
	 * `DATA_SYNC_NAMESPACE` constant.
	 */
	const DATA_SYNC_NAMESPACE = 'jetpack_seo';

	/**
	 * Initialize the package.
	 *
	 * Called from the Jetpack plugin's `late_initialization()` hook.
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( 'jetpack_seo_init' ) ) {
			return;
		}

		// Gate the entire SEO surface on the `seo-tools` module being active,
		// the same way other Jetpack modules do. When the module is off we
		// register nothing — no REST routes, no admin menu, no assets —
		// rather than registering everything and hiding the menu downstream.
		if ( ! self::is_seo_tools_module_active() ) {
			return;
		}

		Connection_Rest_Authentication::init();

		self::register_data_sync();
		add_action( 'admin_menu', array( __CLASS__, 'add_menu_item' ) );

		/**
		 * Fires after the Jetpack SEO package is initialized.
		 *
		 * @since 0.1.0
		 */
		do_action( 'jetpack_seo_init' );
	}

	/**
	 * Register the admin menu item.
	 *
	 * Uses Admin_Menu so the page is reachable on wp-admin across all
	 * site types, including Atomic/WoW where Jetpack > Settings is hidden.
	 *
	 * Only registered when the `seo-tools` module is active — `init()` gates
	 * the whole surface, so by the time this fires the module is guaranteed on.
	 *
	 * @return void
	 */
	public static function add_menu_item() {
		$page_suffix = Admin_Menu::add_menu(
			__( 'SEO', 'jetpack-seo' ),
			__( 'SEO', 'jetpack-seo' ),
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'admin_page' ),
			2
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
			// Bootstrap the data-sync registry onto this page so the React app
			// hydrates from `window.jetpack_seo` without an extra round-trip.
			// `$page_suffix` is the page-render hook, which fires after our
			// footer script registers — so the localize attaches cleanly.
			Data_Sync::get_instance( self::DATA_SYNC_NAMESPACE )->attach_to_plugin( 'jetpack-seo-app', $page_suffix );
		}
	}

	/**
	 * Whether the `seo-tools` Jetpack module is currently active.
	 *
	 * @return bool
	 */
	private static function is_seo_tools_module_active() {
		if ( ! class_exists( 'Automattic\\Jetpack\\Modules' ) ) {
			return false;
		}
		return ( new Modules() )->is_active( 'seo-tools' );
	}

	/**
	 * Runs on `load-{$page_suffix}` — right before the admin page renders.
	 *
	 * @return void
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scripts' ) );
	}

	/**
	 * Render the admin page container.
	 *
	 * The React app mounts into `#jetpack-seo-root`.
	 *
	 * @return void
	 */
	public static function admin_page() {
		echo '<div id="jetpack-seo-root"></div>';
	}

	/**
	 * Enqueue the built JS bundle and localize the initial state.
	 *
	 * @return void
	 */
	public static function enqueue_scripts() {
		Assets::register_script(
			'jetpack-seo-app',
			'../build/index.js',
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-seo',
			)
		);

		wp_localize_script(
			'jetpack-seo-app',
			'jetpackSeoInitialState',
			self::get_initial_state()
		);

		// The REST root + nonce the React app needs are bootstrapped by the
		// data-sync registry onto `window.jetpack_seo.rest_api` (see
		// Data_Sync::attach_to_plugin in add_menu_item()).

		Connection_Initial_State::render_script( 'jetpack-seo-app' );
	}

	/**
	 * Build the initial state passed to the React app.
	 *
	 * Kept intentionally small — the app reads live data via REST. Only
	 * values that affect the first paint live here.
	 *
	 * @return array
	 */
	private static function get_initial_state() {
		$connection = new Connection_Manager();
		$status     = new Status();

		return array(
			'adminUrl'        => esc_url( admin_url() ),
			'seoAdminUrl'     => admin_url( 'admin.php?page=' . self::MENU_SLUG ),
			'siteUrl'         => esc_url( get_site_url() ),
			'siteSuffix'      => $status->get_site_suffix(),
			'blogId'          => Connection_Manager::get_site_id( true ),
			'isSiteConnected' => $connection->is_connected(),
			'isUserConnected' => $connection->is_user_connected(),
			'isAtomic'        => ( new Status_Host() )->is_woa_site(),
			'isSimple'        => ( new Status_Host() )->is_wpcom_simple(),
			'userIsAdmin'     => current_user_can( 'manage_options' ),
			'seoEnabled'      => self::is_seo_enabled(),
			'packageVersion'  => self::PACKAGE_VERSION,
		);
	}

	/**
	 * Whether Jetpack's seo-tools module is enabled on this site.
	 *
	 * @return bool
	 */
	private static function is_seo_enabled() {
		if ( class_exists( 'Jetpack_SEO_Utils' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- Class lives in plugins/jetpack and is guarded by class_exists.
			return (bool) Jetpack_SEO_Utils::is_enabled_jetpack_seo();
		}
		return false;
	}

	/**
	 * Register the package's data-sync entries.
	 *
	 * Replaces the hand-written REST controller — the shared data-sync layer
	 * provides the REST endpoint, nonce handling, schema validation, and the
	 * page bootstrap. The Overview is a read-only aggregate, so it's a
	 * `Data_Sync_Readonly` entry backed by {@see self::get_overview_data()}.
	 *
	 * @return void
	 */
	public static function register_data_sync() {
		Data_Sync::get_instance( self::DATA_SYNC_NAMESPACE )->register(
			'overview',
			self::overview_schema(),
			new Data_Sync_Readonly( array( __CLASS__, 'get_overview_data' ) )
		);
	}

	/**
	 * Schema for the `overview` entry. Single source of truth on the server
	 * side; mirrored by the JS `OverviewSchema` Zod schema.
	 *
	 * @return \Automattic\Jetpack\Schema\Parser
	 */
	private static function overview_schema() {
		return Schema::as_assoc_array(
			array(
				'site_visibility' => Schema::as_assoc_array(
					array(
						'search_engines_visible' => Schema::as_boolean(),
						'sitemap_active'         => Schema::as_boolean(),
						'sitemap_url'            => Schema::as_string(),
						'seo_tools_active'       => Schema::as_boolean(),
						'front_page_description' => Schema::as_string(),
					)
				),
				'plan'            => Schema::as_assoc_array(
					array(
						'seo_enabled_for_site' => Schema::as_boolean(),
					)
				),
			)
		);
	}

	/**
	 * Build the aggregated Overview state the dashboard renders.
	 *
	 * @return array
	 */
	public static function get_overview_data() {
		$modules = new Modules();
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack and is guarded by class_exists.
		$seo_enabled = class_exists( 'Jetpack_SEO_Utils' ) && Jetpack_SEO_Utils::is_enabled_jetpack_seo();
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Same as above; only invoked when class_exists.
		$front_page_desc = $seo_enabled ? Jetpack_SEO_Utils::get_front_page_meta_description() : '';

		return array(
			'site_visibility' => array(
				'search_engines_visible' => (int) get_option( 'blog_public', 1 ) === 1,
				'sitemap_active'         => (bool) get_option( 'jetpack_seo_sitemap_enabled', false ),
				'sitemap_url'            => home_url( '/sitemap.xml' ),
				'seo_tools_active'       => $modules->is_active( 'seo-tools' ),
				'front_page_description' => (string) $front_page_desc,
			),
			'plan'            => array(
				'seo_enabled_for_site' => $seo_enabled,
			),
		);
	}
}

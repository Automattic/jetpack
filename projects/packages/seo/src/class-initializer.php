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
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host as Status_Host;
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

		Connection_Rest_Authentication::init();

		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_endpoints' ) );
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
	 * Gated on the `seo-tools` Jetpack module being active — if the user
	 * has the module turned off the menu item disappears entirely.
	 *
	 * @return void
	 */
	public static function add_menu_item() {
		if ( ! self::is_seo_tools_module_active() ) {
			return;
		}

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

		wp_localize_script(
			'jetpack-seo-app',
			'jetpackSeoRest',
			array(
				'apiRoot'  => esc_url_raw( rest_url() ),
				'apiNonce' => wp_create_nonce( 'wp_rest' ),
			)
		);

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
	 * Register REST endpoints for the jetpack-seo/v1 namespace.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		REST_Controller::register_routes();
	}
}

<?php
/**
 * Primary class for the Jetpack Activity Log package.
 *
 * @package automattic/jetpack-activity-log
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Activity_Log\V0001;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Activity_Log\V0001\Initial_State as Activity_Log_Initial_State;
use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use function add_action;
use function current_user_can;
use function did_action;
use function do_action;
use function is_multisite;
use function wp_add_inline_script;

/**
 * Class Jetpack_Activity_Log
 *
 * Registers the Activity Log admin page and its REST routes inside the
 * main Jetpack plugin.
 */
class Jetpack_Activity_Log {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	const PAGE_SLUG = 'jetpack-activity-log';

	/**
	 * Script handle for the admin bundle.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jetpack-activity-log';

	/**
	 * Entry point. Idempotent: safe to call from multiple bootstraps.
	 */
	public static function initialize() {
		if ( did_action( 'jetpack_activity_log_initialized' ) ) {
			return;
		}

		add_action( 'admin_menu', array( __CLASS__, 'add_wp_admin_submenu' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );

		/**
		 * Fires once the Jetpack Activity Log package has wired its hooks.
		 *
		 * @since 0.1.0
		 */
		do_action( 'jetpack_activity_log_initialized' );
	}

	/**
	 * Register the Activity Log submenu under Jetpack.
	 *
	 * Mirrors the gating used by the legacy my-jetpack "Activity Log" menu
	 * item (connected user + non-multisite).
	 *
	 * @return string|null The resulting page's hook suffix, if registered.
	 */
	public static function add_wp_admin_submenu() {
		if ( ! self::is_available() ) {
			return null;
		}

		$page_suffix = Admin_Menu::add_menu(
			/** "Activity Log" is a product name, do not translate. */
			'Activity Log',
			'Activity Log',
			'manage_options',
			self::PAGE_SLUG,
			array( __CLASS__, 'render_page' ),
			14
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}

		return $page_suffix;
	}

	/**
	 * Whether the Activity Log page should be shown to the current user.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( is_multisite() ) {
			return false;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return ( new Connection_Manager() )->is_user_connected();
	}

	/**
	 * Fires when the admin page is loaded.
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue the admin bundle and seed initial state.
	 */
	public static function enqueue_admin_scripts() {
		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../build/index.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-activity-log',
			)
		);
		Assets::enqueue_script( self::SCRIPT_HANDLE );

		wp_add_inline_script( self::SCRIPT_HANDLE, ( new Activity_Log_Initial_State() )->render(), 'before' );
		Connection_Initial_State::render_script( self::SCRIPT_HANDLE );
	}

	/**
	 * Render the admin page root node. React mounts into this element.
	 */
	public static function render_page() {
		?>
			<div id="jetpack-activity-log-root"></div>
		<?php
	}

	/**
	 * Register the REST routes backing the Activity Log UI.
	 *
	 * Routes are added in Phase 2. This method exists now so that the
	 * `jetpack/v4/activity-log` namespace is reserved and the hook is wired.
	 */
	public static function register_rest_routes() {
		REST_Controller::register_rest_routes();
	}
}

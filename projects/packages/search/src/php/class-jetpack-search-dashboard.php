<?php
/**
 * A class that adds a search dashboard to wp-admin.
 *
 * @package automattic/jetpack
 */
namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Tracking;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Plan;
use Jetpack;
use Jetpack_Search_Helpers;
use Jetpack_Options;
use Jetpack_Search_Options;

/**
 * Responsible for adding a search dashboard to wp-admin.
 *
 * @package Automattic\Jetpack\Search
 */
class Jetpack_Search_Dashboard {
	protected static $instance;

	protected function __construct() {
	}

	public static function instance() {
		if ( is_null( static::$instance ) ) {
			static::$instance = new static();
			static::$instance->init_hooks();
		}
		return static::$instance;
	}

	protected function init_hooks() {
		add_action( 'admin_menu', array( $this, 'add_wp_admin_page' ), 999 );
	}

	public function add_wp_admin_page() {
		$is_offline_mode = ( new Status() )->is_offline_mode();

		// If user is not an admin and site is in Offline Mode or not connected yet then don't do anything.
		if ( ! current_user_can( 'manage_options' ) && ( $is_offline_mode || ! Jetpack::is_connection_ready() ) ) {
			return;
		}

		// Is Jetpack not connected and not offline?
		// True means that Jetpack is NOT connected and NOT in offline mode.
		// If Jetpack is connected OR in offline mode, this will be false.
		$connectable = ! Jetpack::is_connection_ready() && ! $is_offline_mode;

		// Don't add in the modules page unless modules are available!
		if ( $connectable ) {
			return;
		}

		// Check if the site plan changed and deactivate modules accordingly.
		// add_action( 'current_screen', array( $this, 'check_plan_deactivate_modules' ) );

		if ( ! $this->supports_search() ) {
			return;
		}

		// Attach page specific actions in addition to the above.
		$hook = add_submenu_page(
			'jetpack',
			__( 'Search Settings', 'jetpack' ),
			_x( 'Search', 'product name shown in menu', 'jetpack' ),
			'manage_options',
			'jetpack-search',
			array( $this, 'render' ),
			$this->get_link_offset()
		);

		add_action( "admin_print_styles-$hook", array( $this, 'load_admin_styles' ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Override render funtion
	 */
	public function render() {
		?>
		<div id="jp-search-dashboard" class="jp-search-dashboard">
			<div class="hide-if-js"><?php esc_html_e( 'Your Search dashboard requires JavaScript to function properly.', 'jetpack' ); ?></div>
		</div>
		<?php
	}

	/**
	 * Test whether we should show Search menu.
	 *
	 * @return {boolean} Show search sub menu or not.
	 */
	protected function supports_search() {
		return method_exists( 'Jetpack_Plan', 'supports' ) && Jetpack_Plan::supports( 'search' );
	}

	/**
	 * Place the Jetpack Search menu item at the bottom of the Jetpack submenu.
	 *
	 * @return int Menu offset.
	 */
	private function get_link_offset() {
		global $submenu;
		return count( $submenu['jetpack'] );
	}

	/**
	 * Enqueue admin styles.
	 */
	public function load_admin_styles() {
		wp_enqueue_style(
			'jp-search-dashboard',
			plugins_url( 'vendor/automattic/jetpack-search/_inc/build/instant-search/jp-search-dashboard-main.min.css', JETPACK__PLUGIN_FILE ),
			array(),
			Jetpack_Search_Helpers::get_asset_version( 'vendor/automattic/jetpack-search/_inc/build/instant-search/jp-search-dashboard-main.min.css' )
		);
	}

	/**
	 * Enqueue admin scripts.
	 */
	public function load_admin_scripts() {
		$script_deps_path    = JETPACK__PLUGIN_DIR . 'vendor/automattic/jetpack-search/_inc/build/instant-search/jp-search-dashboard-main.min.asset.php';
		$script_dependencies = array( 'react', 'react-dom', 'wp-polyfill' );
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = $asset_manifest['dependencies'];
		}

		if ( ! ( new Status() )->is_offline_mode() && Jetpack::is_connection_ready() ) {
			// Required for Analytics.
			Tracking::register_tracks_functions_scripts( true );
		}

		wp_enqueue_script(
			'jp-search-dashboard',
			plugins_url( 'vendor/automattic/jetpack-search/_inc/build/instant-search/jp-search-dashboard-main.min.js', JETPACK__PLUGIN_FILE ),
			$script_dependencies,
			Jetpack_Search_Helpers::get_asset_version( 'vendor/automattic/jetpack-search/_inc/build/instant-search/jp-search-dashboard-main.min.js' ),
			true
		);

		// Add objects to be passed to the initial state of the app.
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script(
			'jp-search-dashboard',
			'var JETPACK_SEARCH_DASHBOARD_INITIAL_STATE=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( static::get_initial_state() ) ) . '"));',
			'before'
		);

		wp_set_script_translations( 'jp-search-dashboard', 'jetpack' );
	}

	public static function get_initial_state() {
		$current_user_data = self::current_user_data();

		return array(
			'siteData'        => array(
				'WP_API_root'       => esc_url_raw( rest_url() ),
				'WP_API_nonce'      => wp_create_nonce( 'wp_rest' ),
				'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
				'purchaseToken'     => self::get_purchase_token(),
				// 'siteVisibleToSearchEngines' => '1' == get_option( 'blog_public' ), // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
				/**
				 * Whether promotions are visible or not.
				 *
				 * @since 4.8.0
				 *
				 * @param bool $are_promotions_active Status of promotions visibility. True by default.
				 */
				'showPromotions'    => apply_filters( 'jetpack_show_promotions', true ),
				// 'isAtomicSite'               => jetpack_is_atomic_site(),
				// 'plan'                       => Jetpack_Plan::get(),
				// 'isMultisite'                => is_multisite(),
				'adminUrl'          => esc_url( admin_url() ),
				'blogId'            => Jetpack_Options::get_option( 'id', 0 ),
				'version'           => defined( 'JETPACK_SEARCH_PACKAGE_VERSION' ) ? JETPACK_SEARCH_PACKAGE_VERSION : 'dev',
			),
			// 'pluginBaseUrl'    => plugins_url( '', JETPACK__PLUGIN_FILE ),
			// 'connectUrl'       => false == $current_user_data['isConnected'] // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
			// ? Jetpack::init()->build_connect_url( true, false, false )
			// : '',
			// 'currentVersion'   => JETPACK__VERSION,
			// 'rawUrl'           => ( new Status() )->get_site_suffix(),
			// 'adminUrl'         => esc_url( admin_url() ),
			// 'siteTitle'        => (string) htmlspecialchars_decode( get_option( 'blogname' ), ENT_QUOTES ),
			// 'currentIp'        => function_exists( 'jetpack_protect_get_ip' ) ? jetpack_protect_get_ip() : false,
			// 'connectionStatus' => REST_Connector::connection_status( false ),
			'userData'        => array(
				'currentUser' => $current_user_data,
			),
			'jetpackStatus'   => array(),
			'jetpackSettings' => array(
				'search'                 => Jetpack_Search_Options::is_module_enabled(),
				'instant_search_enabled' => Jetpack_Search_Options::is_instant_enabled(),
			),
		);
	}

	/**
	 * Gets a purchase token that is used for Jetpack logged out visitor checkout.
	 * The purchase token should be appended to all CTA url's that lead to checkout.
	 *
	 * @since 9.8.0
	 * @return string|boolean
	 */
	public static function get_purchase_token() {
		if ( ! Jetpack::current_user_can_purchase() ) {
			return false;
		}

		$purchase_token = Jetpack_Options::get_option( 'purchase_token', false );

		if ( $purchase_token ) {
			return $purchase_token;
		}
		// If the purchase token is not saved in the options table yet, then add it.
		Jetpack_Options::update_option( 'purchase_token', self::generate_purchase_token(), true );
		return Jetpack_Options::get_option( 'purchase_token', false );
	}

	/**
	 * Generates a purchase token that is used for Jetpack logged out visitor checkout.
	 *
	 * @since 9.8.0
	 * @return string
	 */
	public static function generate_purchase_token() {
		return wp_generate_password( 12, false );
	}

	/**
	 * Gather data about the current user.
	 *
	 * @since 4.1.0
	 *
	 * @return array
	 */
	public static function current_user_data() {
		$jetpack_connection = new Connection_Manager( 'jetpack' );

		$current_user      = wp_get_current_user();
		$is_user_connected = $jetpack_connection->is_user_connected( $current_user->ID );
		$is_master_user    = $is_user_connected && (int) $current_user->ID && (int) Jetpack_Options::get_option( 'master_user' ) === (int) $current_user->ID;
		$dotcom_data       = $jetpack_connection->get_connected_user_data();

		// Add connected user gravatar to the returned dotcom_data.
		$dotcom_data['avatar'] = ( ! empty( $dotcom_data['email'] ) ?
		get_avatar_url(
			$dotcom_data['email'],
			array(
				'size'    => 64,
				'default' => 'mysteryman',
			)
		)
		: false );

		$current_user_data = array(
			'isConnected' => $is_user_connected,
			'isMaster'    => $is_master_user,
			'username'    => $current_user->user_login,
			'id'          => $current_user->ID,
			'wpcomUser'   => $dotcom_data,
			'gravatar'    => get_avatar_url( $current_user->ID, 64, 'mm', '', array( 'force_display' => true ) ),
			'permissions' => array(
				'admin_page'         => current_user_can( 'jetpack_admin_page' ),
				'connect'            => current_user_can( 'jetpack_connect' ),
				'connect_user'       => current_user_can( 'jetpack_connect_user' ),
				'disconnect'         => current_user_can( 'jetpack_disconnect' ),
				'manage_modules'     => current_user_can( 'jetpack_manage_modules' ),
				'network_admin'      => current_user_can( 'jetpack_network_admin_page' ),
				'network_sites_page' => current_user_can( 'jetpack_network_sites_page' ),
				'edit_posts'         => current_user_can( 'edit_posts' ),
				'publish_posts'      => current_user_can( 'publish_posts' ),
				'manage_options'     => current_user_can( 'manage_options' ),
				'view_stats'         => current_user_can( 'view_stats' ),
				'manage_plugins'     => current_user_can( 'install_plugins' )
										&& current_user_can( 'activate_plugins' )
										&& current_user_can( 'update_plugins' )
										&& current_user_can( 'delete_plugins' ),
			),
		);

		return $current_user_data;
	}

}

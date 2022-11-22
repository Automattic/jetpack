<?php
/**
 * Primary class file for the Jetpack Protect plugin.
 *
 * @package automattic/jetpack-protect-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\JITMS\JITM as JITM;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\My_Jetpack\Products as My_Jetpack_Products;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Protect\Credentials;
use Automattic\Jetpack\Protect\Plan;
use Automattic\Jetpack\Protect\Scan_Status;
use Automattic\Jetpack\Protect\Site_Health;
use Automattic\Jetpack\Protect\Status;
use Automattic\Jetpack\Protect\Threats;
use Automattic\Jetpack\Status as Jetpack_Status;
use Automattic\Jetpack\Sync\Functions as Sync_Functions;
use Automattic\Jetpack\Sync\Sender;

/**
 * Class Jetpack_Protect
 */
class Jetpack_Protect {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );
		add_action( '_admin_menu', array( $this, 'admin_page_init' ) );

		// Init Jetpack packages
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => JETPACK_PROTECT_SLUG,
						'name'     => JETPACK_PROTECT_NAME,
						'url_info' => JETPACK_PROTECT_URI,
					)
				);
				// Sync package.
				$config->ensure(
					'sync',
					array(
						'jetpack_sync_modules'             => array(
							'Automattic\\Jetpack\\Sync\\Modules\\Options',
							'Automattic\\Jetpack\\Sync\\Modules\\Callables',
							'Automattic\\Jetpack\\Sync\\Modules\\Users',
						),
						'jetpack_sync_callable_whitelist'  => array(
							'main_network_site' => array( 'Automattic\\Jetpack\\Connection\\Urls', 'main_network_site_url' ),
							'get_plugins'       => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_plugins' ),
							'get_themes'        => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_themes' ),
							'wp_version'        => array( 'Automattic\\Jetpack\\Sync\\Functions', 'wp_version' ),
						),
						'jetpack_sync_options_contentless' => array(),
						'jetpack_sync_options_whitelist'   => array(
							'active_plugins',
							'stylesheet',
						),
					)
				);

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );
			},
			1
		);
	}

	/**
	 * Initialize the plugin
	 *
	 * @return void
	 */
	public function init() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		add_action( 'admin_bar_menu', array( $this, 'admin_bar' ), 65 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_styles' ) );
		// Add custom WP REST API endoints.
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_endpoints' ) );

		My_Jetpack_Initializer::init();
		Site_Health::init();

		// Sets up JITMS.
		JITM::configure();
	}

	/**
	 * Initialize the admin page resources.
	 */
	public function admin_page_init() {
		$total_threats = Status::get_total_threats();
		$menu_label    = _x( 'Protect', 'The Jetpack Protect product name, without the Jetpack prefix', 'jetpack-protect' );
		if ( $total_threats ) {
			$menu_label .= sprintf( ' <span class="update-plugins">%d</span>', $total_threats );
		}

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Protect', 'jetpack-protect' ),
			$menu_label,
			'manage_options',
			'jetpack-protect',
			array( $this, 'plugin_settings_page' ),
			99
		);

		add_action( 'load-' . $page_suffix, array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueues the wp-admin styles (used outside the React app)
	 */
	public function enqueue_admin_styles() {
		wp_enqueue_style( 'jetpack-protect-wpadmin', JETPACK_PROTECT_BASE_PLUGIN_URL . '/assets/jetpack-protect.css', array(), JETPACK_PROTECT_VERSION );
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {

		Assets::register_script(
			'jetpack-protect',
			'build/index.js',
			JETPACK_PROTECT_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-protect',
			)
		);
		Assets::enqueue_script( 'jetpack-protect' );
		// Required for Analytics.
		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-protect', Connection_Initial_State::render(), 'before' );
		wp_add_inline_script( 'jetpack-protect', $this->render_initial_state(), 'before' );

	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var jetpackProtectInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	public function initial_state() {
		global $wp_version;
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$refresh_status_from_wpcom = isset( $_GET['checkPlan'] );
		$initial_state             = array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			'status'            => Status::get_status( $refresh_status_from_wpcom ),
			'installedPlugins'  => Plugins_Installer::get_plugins(),
			'installedThemes'   => Sync_Functions::get_themes(),
			'wpVersion'         => $wp_version,
			'adminUrl'          => 'admin.php?page=jetpack-protect',
			'siteSuffix'        => ( new Jetpack_Status() )->get_site_suffix(),
			'jetpackScan'       => My_Jetpack_Products::get_product( 'scan' ),
			'productData'       => My_Jetpack_Products::get_product( 'protect' ),
			'hasRequiredPlan'   => Plan::has_required_plan(),
		);

		$initial_state['jetpackScan']['pricingForUi'] = Plan::get_product( 'jetpack_scan' );

		return $initial_state;
	}
	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="jetpack-protect-root"></div>
		<?php
	}

	/**
	 * Removes plugin from the connection manager
	 * If it's the last plugin using the connection, the site will be disconnected.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {

		// Clear Sync data.
		Sender::get_instance()->uninstall();

		$manager = new Connection_Manager( 'jetpack-protect' );
		$manager->remove_connection();

		Status::delete_option();
	}

	/**
	 * Create a shortcut on Admin Bar to show the total of threats found.
	 *
	 * @param object $wp_admin_bar The Admin Bar object.
	 * @return void
	 */
	public function admin_bar( $wp_admin_bar ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$total = Status::get_total_threats();

		if ( $total > 0 ) {
			$args = array(
				'id'    => 'jetpack-protect',
				'title' => '<span class="ab-icon jp-protect-icon"></span><span class="ab-label">' . $total . '</span>',
				'href'  => admin_url( 'admin.php?page=jetpack-protect' ),
				'meta'  => array(
					// translators: %d is the number of threats found.
					'title' => sprintf( _n( '%d threat found by Jetpack Protect', '%d threats found by Jetpack Protect', $total, 'jetpack-protect' ), $total ),
				),
			);

			$wp_admin_bar->add_node( $args );
		}
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'jetpack-protect/v1',
			'check-plan',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_check_plan',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'status',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_get_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'clear-scan-cache',
			array(
				'methods'             => \WP_REST_SERVER::EDITABLE,
				'callback'            => __CLASS__ . '::api_clear_scan_cache',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'ignore-threat',
			array(
				'methods'             => \WP_REST_SERVER::EDITABLE,
				'callback'            => __CLASS__ . '::api_ignore_threat',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'fix-threats',
			array(
				'methods'             => \WP_REST_SERVER::EDITABLE,
				'callback'            => __CLASS__ . '::api_fix_threats',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'fix-threats-status',
			array(
				'methods'             => \WP_REST_SERVER::READABLE,
				'callback'            => __CLASS__ . '::api_fix_threats_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'check-credentials',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_check_credentials',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'scan',
			array(
				'methods'             => \WP_REST_SERVER::EDITABLE,
				'callback'            => __CLASS__ . '::api_scan',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Return site plan data for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_check_plan() {
		$has_required_plan = Plan::has_required_plan();

		return rest_ensure_response( $has_required_plan, 200 );
	}

	/**
	 * Return Protect Status for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_get_status( $request ) {
		$status = Status::get_status( $request['hard_refresh'] );
		return rest_ensure_response( $status, 200 );
	}

	/**
	 * Clear the Scan_Status cache for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_clear_scan_cache() {
		$cache_cleared = Scan_Status::delete_option();

		if ( ! $cache_cleared ) {
			return new WP_REST_Response( 'An error occured while attempting to clear the Jetpack Scan cache.', 500 );
		}

		return new WP_REST_Response( 'Jetpack Scan cache cleared.' );
	}

	/**
	 * Ignores a threat for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_ignore_threat( $request ) {
		if ( ! $request['threat_id'] ) {
			return new WP_REST_RESPONSE( 'Missing threat ID.', 400 );
		}

		$threat_ignored = Threats::ignore_threat( $request['threat_id'] );

		if ( ! $threat_ignored ) {
			return new WP_REST_Response( 'An error occured while attempting to ignore the threat.', 500 );
		}

		return new WP_REST_Response( 'Threat ignored.' );
	}

	/**
	 * Fixes threats for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_fix_threats( $request ) {
		if ( empty( $request['threat_ids'] ) ) {
			return new WP_REST_RESPONSE( 'Missing threat IDs.', 400 );
		}

		$threats_fixed = Threats::fix_threats( $request['threat_ids'] );

		if ( ! $threats_fixed ) {
			return new WP_REST_Response( 'An error occured while attempting to fix the threat.', 500 );
		}

		return new WP_REST_Response( $threats_fixed );
	}

	/**
	 * Fixes threats for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_fix_threats_status( $request ) {
		if ( empty( $request['threat_ids'] ) ) {
			return new WP_REST_RESPONSE( 'Missing threat IDs.', 400 );
		}

		$threats_fixed = Threats::fix_threats_status( $request['threat_ids'] );

		if ( ! $threats_fixed ) {
			return new WP_REST_Response( 'An error occured while attempting to get the fixer status of the threats.', 500 );
		}

		return new WP_REST_Response( $threats_fixed );
	}

	/**
	 * Checks if the site has credentials configured
	 *
	 * @return WP_REST_Response
	 */
	public static function api_check_credentials() {
		$credential_array = Credentials::get_credential_array();

		if ( ! isset( $credential_array ) ) {
			return new WP_REST_Response( 'An error occured while attempting to fetch the credentials array', 500 );
		}

		return new WP_REST_Response( $credential_array );
	}

	/**
	 * Enqueues a scan for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_scan() {
		$scan_enqueued = Threats::scan();

		if ( ! $scan_enqueued ) {
			return new WP_REST_Response( 'An error occured while attempting to enqueue the scan.', 500 );
		}

		return new WP_REST_Response( 'Scan enqueued.' );
	}
}

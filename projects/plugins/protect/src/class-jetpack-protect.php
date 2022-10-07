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
use Automattic\Jetpack\Protect\Site_Health;
use Automattic\Jetpack\Protect\Status as Protect_Status;
use Automattic\Jetpack\Status as Status;
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
						),
						'jetpack_sync_callable_whitelist'  => array(
							'get_plugins' => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_plugins' ),
							'get_themes'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_themes' ),
							'wp_version'  => array( 'Automattic\\Jetpack\\Sync\\Functions', 'wp_version' ),
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

		$total_threats = Protect_Status::get_total_threats();
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
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );

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
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
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
		$initial_state = array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			'status'            => Protect_Status::get_status(),
			'installedPlugins'  => Plugins_Installer::get_plugins(),
			'installedThemes'   => Sync_Functions::get_themes(),
			'wpVersion'         => $wp_version,
			'adminUrl'          => admin_url( 'admin.php?page=jetpack-protect' ),
			'siteSuffix'        => ( new Status() )->get_site_suffix(),
			'jetpackScan'       => My_Jetpack_Products::get_product( 'scan' ),
			'productData'       => My_Jetpack_Products::get_product( 'protect' ),
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

		Protect_Status::delete_option();
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

		$total = Protect_Status::get_total_threats();

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
			'status',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_get_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Return Protect Status for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_get_status() {
		$status = Protect_Status::get_status();
		return rest_ensure_response( $status, 200 );
	}
}

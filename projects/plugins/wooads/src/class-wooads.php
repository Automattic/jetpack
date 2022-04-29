<?php
/**
 * WooAds API endpoints.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/wooads
 */

/**
 * Primary class file for the WooAds plugin.
 *
 * @package automattic/wooads-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'WOOADS_REST_NAMESPACE' ) ) {
	define( 'WOOADS_REST_NAMESPACE', 'wordads-dsp/v1' );
}

// For use in situations where you want additional namespacing.
if ( ! defined( 'WOOADS_REST_PREFIX' ) ) {
	define( 'WOOADS_REST_PREFIX', '' );
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Sync\Data_Settings;
use Automattic\WooAds\WooAds_Campaigns;

/**
 * Class WooAds
 */
class WooAds {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		$page_suffix = Admin_Menu::add_menu(
			__( 'WooAds', 'wooads' ),
			_x( 'WooAds', 'The WooAds product name, without the Jetpack prefix', 'wooads' ),
			'manage_options',
			'wooads',
			array( $this, 'plugin_settings_page' ),
			99
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );

		// Init Jetpack packages and ConnectionUI.
		add_action(
			'plugins_loaded',
			static function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => WOOADS_SLUG,
						'name'     => WOOADS_NAME,
						'url_info' => WOOADS_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync', Data_Settings::MUST_SYNC_DATA_SETTINGS );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );
			},
			1
		);

		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		My_Jetpack_Initializer::init();
	}

	/**
	 * Register Speed Score related REST routes.
	 */
	public function register_rest_routes() {
		register_rest_route(
			WOOADS_REST_NAMESPACE,
			WOOADS_REST_PREFIX . '/wordads-dsp/opted',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'is_blog_opted_in' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			WOOADS_REST_NAMESPACE,
			WOOADS_REST_PREFIX . '/wordads-dsp/create',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_campaigns' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		Assets::register_script(
			'wooads',
			'build/index.js',
			WOOADS_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'wooads',
			)
		);
		Assets::enqueue_script( 'wooads' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'wooads', Connection_Initial_State::render(), 'before' );
		wp_add_inline_script( 'wooads', $this->render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var wooAdsInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	public function initial_state() {
		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			'blogId'            => get_current_blog_id(),
			'campaigns'         => $this->get_campaigns(),
			'wooAdsOptedIn'     => $this->is_blog_opted_in(),
		);
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="wooads-root"></div>
		<?php
	}

	/**
	 * API: Get the wooads campaigns fetching the WPCOM api
	 *
	 * @return array[]|true|WP_Error
	 */
	public function get_campaigns() {
		$wooads_campaigns = new WooAds_Campaigns();
		// $response = $wooads_campaigns->handle_get_campaigns();
		$response = $wooads_campaigns->handle_get_campaigns_stub();
		return $response;
	}

	/**
	 * Is the blog opted in Wooads?
	 *
	 * @return bool
	 */
	public function is_blog_opted_in() {
		$wooads_campaigns = new WooAds_Campaigns();
		$response         = $wooads_campaigns->handle_blog_opted_in_stub();
		return $response;
	}
}

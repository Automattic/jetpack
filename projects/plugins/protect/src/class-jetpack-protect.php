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
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Plugins_Installer;
use Automattic\Jetpack\Protect\Site_Health;
use Automattic\Jetpack\Protect\Status;
use Automattic\Jetpack\Sync\Functions as Sync_Functions;

/**
 * Class Jetpack_Protect
 */
class Jetpack_Protect {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * Initialize the plugin
	 *
	 * @return void
	 */
	public function init() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		$total_vuls = Status::get_total_vulnerabilities();
		$menu_label = _x( 'Protect', 'The Jetpack Protect product name, without the Jetpack prefix', 'jetpack-protect' );
		if ( $total_vuls ) {
			$menu_label .= sprintf( ' <span class="update-plugins">%d</span>', $total_vuls );
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

		// Init Jetpack packages and ConnectionUI.
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

		add_action( 'admin_bar_menu', array( $this, 'admin_bar' ), 65 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_styles' ) );

		My_Jetpack_Initializer::init();
		Site_Health::init();
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
		wp_enqueue_style( 'jetpack-protect-wpadmin', JETPACK_PROTECT_BASE_PLUGIN_URL . '/css/jetpack-protect.css', array(), JETPACK_PROTECT_VERSION );
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
		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			'status'            => Status::get_status(),
			'installedPlugins'  => Plugins_Installer::get_plugins(),
			'installedThemes'   => Sync_Functions::get_themes(),
			'wpVersion'         => $wp_version,
		);
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
	 * Create a shortcut on Admin Bar to show the total of vulnerabilities found.
	 *
	 * @param object $wp_admin_bar The Admin Bar object.
	 * @return void
	 */
	public function admin_bar( $wp_admin_bar ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$total = Status::get_total_vulnerabilities();

		if ( $total > 0 ) {
			$args = array(
				'id'    => 'jetpack-protect',
				'title' => '<span class="ab-icon noticon icon-protect"></span><span class="ab-label">' . $total . '</span>',
				'href'  => admin_url( 'admin.php?page=jetpack-protect' ),
				'meta'  => array(
					// translators: %d is the number of vulnerabilities found.
					'title' => sprintf( _n( '%d vulnerability found by Jetpack Protect', '%d vulnerabilities found by Jetpack Protect', $total, 'jetpack-protect' ), $total ),
				),
			);

			$wp_admin_bar->add_node( $args );
		}
	}
}

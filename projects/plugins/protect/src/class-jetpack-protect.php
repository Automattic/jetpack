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
use Automattic\Jetpack\Protect\Status;

/**
 * Class Jetpack_Protect
 */
class Jetpack_Protect {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Protect', 'jetpack-protect' ),
			_x( 'Protect', 'The Jetpack Protect product name, without the Jetpack prefix', 'jetpack-protect' ),
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
				$config->ensure( 'sync' );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );
			},
			1
		);

		My_Jetpack_Initializer::init();
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
		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			'status'            => Status::get_status(),
			'installedPlugins'  => Plugins_Installer::get_plugins(),
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
}

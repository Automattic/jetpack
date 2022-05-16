<?php
/**
 * Primary class file for the Jetpack Social plugin.
 *
 * @package automattic/jetpack-social-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;

/**
 * Class Jetpack_Social
 */
class Jetpack_Social {
	const JETPACK_PUBLICIZE_MODULE_SLUG    = 'publicize';
	const JETPACK_SOCIAL_ACTIVATION_OPTION = JETPACK_SOCIAL_PLUGIN_SLUG . '_activated';

	/**
	 * The connection manager used to check if we have a Jetpack connection.
	 *
	 * @var Connection_Manager
	 */
	private $manager = null;

	/**
	 * Constructor.
	 *
	 * @param Connection_Manager $connection_manager The Jetpack connection manager to use.
	 */
	public function __construct( $connection_manager = null ) {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Social', 'jetpack-social' ),
			_x( 'Social', 'The Jetpack Social product name, without the Jetpack prefix', 'jetpack-social' ),
			'manage_options',
			'jetpack-social',
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
						'slug'     => JETPACK_SOCIAL_PLUGIN_SLUG,
						'name'     => JETPACK_SOCIAL_PLUGIN_NAME,
						'url_info' => JETPACK_SOCIAL_PLUGIN_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync' );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );

				// Publicize package.
				$config->ensure( 'publicize' );
			},
			1
		);

		// Activate the module as the plugin is activated
		add_action( 'admin_init', array( $this, 'activate_module_on_plugin_activation' ) );

		My_Jetpack_Initializer::init();

		$this->manager = $connection_manager ? $connection_manager : new Connection_Manager();

		// Add block editor assets
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_scripts' ) );
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
			'jetpack-social',
			'build/index.js',
			JETPACK_SOCIAL_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-social',
			)
		);

		Assets::enqueue_script( 'jetpack-social' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-social', Connection_Initial_State::render(), 'before' );
		wp_add_inline_script( 'jetpack-social', $this->render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var jetpackSocialInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	public function initial_state() {
		global $publicize;

		return array(
			'apiRoot'                          => esc_url_raw( rest_url() ),
			'apiNonce'                         => wp_create_nonce( 'wp_rest' ),
			'registrationNonce'                => wp_create_nonce( 'jetpack-registration-nonce' ),
			'connections'                      => $publicize->get_all_connections_for_user(), // TODO: Sanitize the array
			'jetpackSocialConnectionsAdminUrl' => esc_url_raw( $publicize->publicize_connections_url( 'jetpack-social-connections-admin-page' ) ),
		);
	}

	/**
	 * Enqueue block editor scripts and styles.
	 */
	public function enqueue_block_editor_scripts() {
		Assets::register_script(
			'jetpack-social-editor',
			'build/editor.js',
			JETPACK_SOCIAL_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-social',
			)
		);

		Assets::enqueue_script( 'jetpack-social-editor' );
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="jetpack-social-root"></div>
		<?php
	}

	/**
	 * Activate the Publicize module on plugin activation.
	 *
	 * @static
	 */
	public static function plugin_activation() {
		add_option( self::JETPACK_SOCIAL_ACTIVATION_OPTION, true );
	}

	/**
	 * Helper to check that we have a Jetpack connection.
	 */
	private function is_connected() {
		return $this->manager->is_connected();
	}

	/**
	 * Runs an admin_init and checks the activation option to work out
	 * if we should activate the module. This needs to be run after the
	 * activation hook, as that results in a redirect, and we need the
	 * sync module's actions and filters to be registered.
	 */
	public function activate_module_on_plugin_activation() {
		if ( get_option( self::JETPACK_SOCIAL_ACTIVATION_OPTION ) && $this->is_connected() ) {
			delete_option( self::JETPACK_SOCIAL_ACTIVATION_OPTION );
			( new Modules() )->activate( self::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
		}
	}
}

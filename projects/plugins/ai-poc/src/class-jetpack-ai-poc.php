<?php
/**
 * Primary class file for the Jetpack AI POC plugin.
 *
 * @package automattic/jetpack-ai-poc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;

/**
 * Class Jetpack_AI_POC
 */
class Jetpack_AI_POC {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		// Initialize My Jetpack
		My_Jetpack_Initializer::init();

		// Initialize abilities system
		new Jetpack_AI_POC_Abilities_Registry();

		// Initialize admin settings
		new Jetpack_AI_POC_Admin_Settings();

		// Initialize REST API endpoints
		new Jetpack_AI_POC_REST_Agent();

		// Enqueue scripts on My Jetpack page
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_my_jetpack_scripts' ) );

		// Init Jetpack packages
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => JETPACK_AI_POC_SLUG,
						'name'     => JETPACK_AI_POC_NAME,
						'url_info' => JETPACK_AI_POC_URI,
					)
				);
			},
			1
		);
	}

	/**
	 * Enqueue scripts for My Jetpack page.
	 *
	 * @param string $hook The current admin page hook.
	 */
	public function enqueue_my_jetpack_scripts( $hook ) {
		// Check if we're on My Jetpack page or any admin page containing 'my-jetpack'
		if ( false === strpos( $hook, 'my-jetpack' ) && false === strpos( $_SERVER['REQUEST_URI'] ?? '', 'my-jetpack' ) ) {
			return;
		}

		Assets::register_script(
			'jetpack-ai-poc-my-jetpack',
			'build/my-jetpack.js',
			JETPACK_AI_POC_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-ai-poc',
			)
		);
		Assets::enqueue_script( 'jetpack-ai-poc-my-jetpack' );
		wp_add_inline_script( 'jetpack-ai-poc-my-jetpack', $this->render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var jetpackAIPOCInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
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
			'hasApiKey'         => ! empty( get_option( 'jetpack_ai_poc_anthropic_api_key' ) ),
		);
	}

	/**
	 * Removes plugin from the connection manager.
	 * If it's the last plugin using the connection, the site will be disconnected.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {
		$manager = new Connection_Manager( 'jetpack-ai-poc' );
		$manager->remove_connection();
	}
}

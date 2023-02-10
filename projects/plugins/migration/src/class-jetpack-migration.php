<?php
/**
 * Primary class file for the Jetpack Migration plugin.
 *
 * @package automattic/jetpack-migration-plugin
 */

namespace Automattic\Jetpack\Migration;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Sync\Data_Settings;

/**
 * Class Jetpack_Migration
 */
class Jetpack_Migration {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		// Set up the REST API routes.
		new REST_Controller();

		// Set up the top-level menu
		add_action( 'admin_menu', array( $this, 'admin_menu_hook_callback' ), 1000 ); // Jetpack uses 998.

		// Init Jetpack packages
		add_action(
			'plugins_loaded',
			function () {
				$config = new \Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => JETPACK_MIGRATION_SLUG,
						'name'     => JETPACK_MIGRATION_NAME,
						'url_info' => JETPACK_MIGRATION_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync', Data_Settings::MUST_SYNC_DATA_SETTINGS );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );
			},
			1
		);

		My_Jetpack_Initializer::init();
	}

	/**
	 * Set up the admin menu.
	 */
	public function admin_menu_hook_callback() {
		$page_suffix = add_menu_page(
			'Move to WordPress.com',
			'Move to WordPress.com',
			'manage_options',
			'jetpack-migration',
			array( $this, 'plugin_settings_page' ),
			'dashicons-admin-generic',
			79 // right before the Settings menu (80)
		);

		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
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
			'jetpack-migration',
			'build/index.js',
			JETPACK_MIGRATION_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-migration',
			)
		);
		Assets::enqueue_script( 'jetpack-migration' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-migration', Connection_Initial_State::render(), 'before' );
		wp_add_inline_script( 'jetpack-migration', $this->render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var jetpackMigrationInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
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
		);
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="jetpack-migration-root"></div>
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
		$manager = new Connection_Manager( 'jetpack-migration' );
		$manager->remove_connection();
	}
}

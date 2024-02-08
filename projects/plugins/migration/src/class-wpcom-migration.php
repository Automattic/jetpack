<?php
/**
 * Primary class file for the Move to WordPress.com plugin.
 *
 * @package automattic/wpcom-migration-plugin
 */

namespace Automattic\Jetpack\Migration;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Backup\V0002\Jetpack_Backup;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Sync\Data_Settings;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

/**
 * Class WPCOM_Migration
 */
class WPCOM_Migration {

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
						'slug'     => WPCOM_MIGRATION_SLUG,
						'name'     => WPCOM_MIGRATION_NAME,
						'url_info' => WPCOM_MIGRATION_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync', Data_Settings::MUST_SYNC_DATA_SETTINGS );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );
			},
			1
		);
		Jetpack_Backup::initialize();
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
			'wpcom-migration',
			array( $this, 'plugin_settings_page' ),
			'dashicons-migrate',
			79 // right before the Settings menu (80)
		);

		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
	}

	/**
	 * Returns whether we are in condition to track to use
	 * Analytics functionality like Tracks, MC, or GA.
	 */
	public static function can_use_analytics() {
		$status     = new Status();
		$connection = new Connection_Manager();
		$tracking   = new Tracking( 'jetpack', $connection );

		return $tracking->should_enable_tracking( new Terms_Of_Service(), $status );
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
			'wpcom-migration',
			'build/index.js',
			WPCOM_MIGRATION_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'wpcom-migration',
			)
		);
		Assets::enqueue_script( 'wpcom-migration' );

		// Required for Analytics.
		if ( self::can_use_analytics() ) {
			Tracking::register_tracks_functions_scripts( true );
		}
		// Initial JS state including JP Connection data.
		Connection_Initial_State::render_script( 'wpcom-migration' );
		wp_add_inline_script( 'wpcom-migration', $this->render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var wpcomMigrationInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
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
			<div id="wpcom-migration-root"></div>
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
		$manager = new Connection_Manager( 'wpcom-migration' );
		$manager->remove_connection();
	}
}

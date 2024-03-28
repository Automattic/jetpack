<?php
/**
 * Primary class file for the Automattic For Agencies Client plugin.
 *
 * @package automattic/automattic-for-agencies-client-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Plugin_Deactivation\Deactivation_Handler;
use Automattic\Jetpack\Sync\Data_Settings;

/**
 * Class Automattic_For_Agencies_Client
 */
class Automattic_For_Agencies_Client {
	/**
	 * Initialize the plugin.
	 */
	public static function init() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		// Init Jetpack packages
		add_action( 'plugins_loaded', array( static::class, 'init_packages' ), 1 );

		// Add submenu.
		add_action( 'admin_menu', array( static::class, 'add_submenu' ) );

		// Add scripts and styles to our admin page.
		add_action( 'load-settings_page_' . AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG, array( static::class, 'load_scripts_styles' ) );

		// Display a modal when trying to deactivate the plugin.
		Deactivation_Handler::init( AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG, __DIR__ . '/admin/deactivation-dialog.php' );
	}

	/**
	 * Configure what Jetpack packages should get automatically initialized.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function init_packages() {
		$config = new Automattic\Jetpack\Config();

		// Connection package.
		$config->ensure(
			'connection',
			array(
				'slug'     => AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG,
				'name'     => AUTOMATTIC_FOR_AGENCIES_CLIENT_NAME,
				'url_info' => AUTOMATTIC_FOR_AGENCIES_CLIENT_URI,
			)
		);
		// Sync package.
		$must_sync_data = Data_Settings::MUST_SYNC_DATA_SETTINGS;
		// Add additional modules.
		$must_sync_data['jetpack_sync_modules'][] = 'Automattic\\Jetpack\\Sync\\Modules\\Plugins';
		$must_sync_data['jetpack_sync_modules'][] = 'Automattic\\Jetpack\\Sync\\Modules\\Users';
		$must_sync_data['jetpack_sync_modules'][] = 'Automattic\\Jetpack\\Sync\\Modules\\Meta';
		$must_sync_data['jetpack_sync_modules'][] = 'Automattic\\Jetpack\\Sync\\Modules\\Stats';
		$config->ensure( 'sync', $must_sync_data );

		// Identity crisis package.
		$config->ensure( 'identity_crisis' );
	}

	/**
	 * Add submenu.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function add_submenu() {
		add_submenu_page(
			'',
			AUTOMATTIC_FOR_AGENCIES_CLIENT_NAME,
			__( 'Automattic for Agencies', 'automattic-for-agencies-client' ),
			'manage_options',
			AUTOMATTIC_FOR_AGENCIES_CLIENT_SLUG,
			array( static::class, 'plugin_settings_page' )
		);
	}

	/**
	 * Set up Admin Settings screen.
	 */
	public static function load_scripts_styles() {
		add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public static function enqueue_admin_scripts() {
		Assets::register_script(
			'automattic-for-agencies-client',
			'build/index.js',
			AUTOMATTIC_FOR_AGENCIES_CLIENT_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'automattic-for-agencies-client',
			)
		);
		Assets::enqueue_script( 'automattic-for-agencies-client' );
		// Initial JS state including JP Connection data.
		Connection_Initial_State::render_script( 'automattic-for-agencies-client' );
		wp_add_inline_script( 'automattic-for-agencies-client', static::render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	private static function render_initial_state() {
		return 'var automatticForAgenciesClientInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( static::initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	private static function initial_state() {
		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
		);
	}

	/**
	 * Main plugin settings page.
	 */
	public static function plugin_settings_page() {
		?>
			<div id="automattic-for-agencies-client-root"></div>
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
		$manager = new Connection_Manager( 'automattic-for-agencies-client' );
		$manager->remove_connection();
	}
}

<?php
/**
 * Primary class file for the Jetpack Backup plugin.
 *
 * @package automattic/jetpack-backup-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;

/**
 * Class Jetpack_Backup
 */
class Jetpack_Backup {
	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Backup', 'jetpack-backup' ),
			__( 'Jetpack Backup', 'jetpack-backup' ),
			'manage_options',
			'jetpack-backup',
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
						'slug'     => JETPACK_BACKUP_PLUGIN_SLUG,
						'name'     => JETPACK_BACKUP_PLUGIN_NAME,
						'url_info' => JETPACK_BACKUP_PLUGIN_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync' );

				// Connection Manager UI.
				Automattic\Jetpack\ConnectionUI\Admin::init();
			},
			1
		);

		// Add "Settings" link to plugins page.
		add_filter(
			'plugin_action_links_' . JETPACK_BACKUP_PLUGIN_FOLDER . '/jetpack-backup.php',
			function ( $actions ) {
				$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-backup' ) ) . '">' . __( 'Settings', 'jetpack-backup' ) . '</a>';
				array_unshift( $actions, $settings_link );

				return $actions;
			}
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
		$build_assets = require_once JETPACK_BACKUP_PLUGIN_DIR . '/build/index.asset.php';

		// Main JS file.
		wp_register_script(
			'jetpack-backup-script',
			plugins_url( 'build/index.js', JETPACK_BACKUP_PLUGIN_ROOT_FILE ),
			$build_assets['dependencies'],
			$build_assets['version'],
			true
		);
		wp_enqueue_script( 'jetpack-backup-script' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-backup-script', $this->get_initial_state(), 'before' );

		// Translation assets.
		wp_set_script_translations( 'jetpack-backup-script-translations', 'jetpack-backup' );

		// Main CSS file.
		wp_enqueue_style(
			'jetpack-backup-style',
			plugins_url( 'build/index.css', JETPACK_BACKUP_PLUGIN_ROOT_FILE ),
			array( 'wp-components' ),
			$build_assets['version']
		);
		// RTL CSS file.
		wp_style_add_data(
			'jetpack-backup-style',
			'rtl',
			plugins_url( 'build/index.rtl.css', JETPACK_BACKUP_PLUGIN_ROOT_FILE )
		);
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="jetpack-backup-root"></div>
		<?php
	}

	/**
	 * Return the rendered initial state JavaScript code.
	 *
	 * @return string
	 */
	private function get_initial_state() {
		require_once JETPACK_BACKUP_PLUGIN_DIR . '/src//php/class-initial-state.php';
		return ( new Initial_State() )->render();
	}

	/**
	 * Register REST API
	 */
	public function register_rest_routes() {

		// Get information on most recent 10 backups.
		register_rest_route(
			'jetpack/v4',
			'/backups',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_recent_backups',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

		// Get site backup/scan/anti-spam capabilities.
		register_rest_route(
			'jetpack/v4',
			'/backup-capabilities',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_backup_capabilities',
				'permission_callback' => __CLASS__ . '::backups_permissions_callback',
			)
		);

	}

	/**
	 * The backup calls should only occur from a signed in admin user
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function backups_permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get information about recent backups
	 *
	 * @access public
	 * @static
	 *
	 * @return array An array of recent backups
	 */
	public static function get_recent_backups() {
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
			'/sites/' . $blog_id . '/rewind/backups',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( 200 !== $response['response']['code'] ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	/**
	 * Get an array of backup/scan/anti-spam site capabilities
	 *
	 * @access public
	 * @static
	 *
	 * @return array An array of capabilities
	 */
	public static function get_backup_capabilities() {
		$blog_id = \Jetpack_Options::get_option( 'id' );

		$response = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/rewind/capabilities',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}

		if ( 200 !== $response['response']['code'] ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}
}

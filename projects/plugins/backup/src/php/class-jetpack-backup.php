<?php
/**
 * Primary class file for the Jetpack Backup plugin.
 *
 * @package automattic/jetpack-backup-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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

		add_action(
			'admin_menu',
			function () {
				$page_suffix = $this->admin_menu();
				add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
			}
		);

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
	 * Plugin admin menu setup.
	 *
	 * @return string The toplevel plugin admin page hook_suffix.
	 */
	public function admin_menu() {
		return add_menu_page(
			__( 'Jetpack Backup', 'jetpack-backup' ),
			__( 'Backup', 'jetpack-backup' ),
			'manage_options',
			'jetpack-backup',
			array( $this, 'plugin_settings_page' ),
			'dashicons-image-rotate',
			99
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
}

<?php
/**
 * Primary class file for the Jetpack Backup plugin.
 *
 * @package automattic/jetpack-backup
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Jetpack_Backup
 */
class Jetpack_Backup {
	/**
	 * Constructor.
	 */
	public function __construct() {
		self::admin_init();
	}

	/**
	 * Initialize the admin resources.
	 */
	private function admin_init() {
		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action(
			'plugins_loaded',
			function () {
				Automattic\Jetpack\ConnectionUI\Admin::init();
			}
		);
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		$build_assets = require_once JETPACK_BACKUP_PLUGIN_DIR . '/build/index.asset.php';
		wp_register_script(
			'jetpack-backup-script',
			plugins_url( 'build/index.js', JETPACK_BACKUP_PLUGIN_ROOT_FILE ),
			$build_assets['dependencies'],
			$build_assets['version'],
			true
		);
		wp_enqueue_script( 'jetpack-backup-script' );

		wp_add_inline_script( 'jetpack-backup-script', $this->get_initial_state(), 'before' );

		wp_set_script_translations( 'react-jetpack-backup-script', 'jetpack', 'jetpack-backup' );

		wp_enqueue_style(
			'jetpack-backup-style',
			plugins_url( 'build/index.css', JETPACK_BACKUP_PLUGIN_ROOT_FILE ),
			array( 'wp-components' ),
			$build_assets['version']
		);
		wp_style_add_data(
			'jetpack-backup-style',
			'rtl',
			plugins_url( 'build/index.rtl.css', JETPACK_BACKUP_PLUGIN_ROOT_FILE )
		);
	}

	/**
	 * Plugin admin menu setup.
	 */
	public function admin_menu() {
		add_menu_page(
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

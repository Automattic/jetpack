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
	}

	/**
	 * Enqueue plugin admin scripts.
	 */
	public function enqueue_admin_scripts() {
		$build_assets = require_once JETPACK_BACKUP_PLUGIN_DIR . '/build/index.asset.php';
		wp_register_script(
			'jetpack-backup-main-js',
			plugins_url( 'build/index.js', JETPACK_BACKUP_PLUGIN_ROOT_FILE ),
			$build_assets['dependencies'],
			$build_assets['version'],
			true
		);
		wp_enqueue_script( 'jetpack-backup-main-js' );
	}

	/**
	 * Plugin admin menu setup.
	 */
	public function admin_menu() {
		add_menu_page(
			__( 'Jetpack Backup', 'jetpack-backup' ),
			__( 'Backup', 'jetpack-backup' ),
			'manage_options',
			'jetpack-backup-menu',
			array( $this, 'plugin_settings_page' ),
			'dashicons-superhero',
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
}

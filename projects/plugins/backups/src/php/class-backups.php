<?php
/**
 * Primary class file for the Backups plugin.
 *
 * @package automattic/backups
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Backups
 */
class Backups {
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
		$build_assets = require_once BACKUPS_PLUGIN_DIR . '/build/index.asset.php';
		wp_register_script(
			'backups-main-js',
			plugins_url( 'build/index.js', BACKUPS_PLUGIN_ROOT_FILE ),
			$build_assets['dependencies'],
			$build_assets['version'],
			true
		);
		wp_enqueue_script( 'backups-main-js' );
	}

	/**
	 * Plugin admin menu setup.
	 */
	public function admin_menu() {
		add_menu_page(
			__( 'Backups', 'backups' ),
			__( 'Backups', 'backups' ),
			'manage_options',
			'backups-menu',
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
			<div id="backups-root"></div>
		<?php
	}
}

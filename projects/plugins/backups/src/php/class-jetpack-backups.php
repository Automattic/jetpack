<?php
/**
 * Primary class file for the Jetpack Backups plugin.
 *
 * @package automattic/jetpack-backups
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Jetpack_Backups
 */
class Jetpack_Backups {
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
		wp_register_script(
			'jetpack-backups-main-js',
			plugins_url( 'src/js/index.js', JETPACK_BACKUPS_PLUGIN_ROOT_FILE ),
			array(),
			'1.0.0',
			true
		);
		wp_enqueue_script( 'jetpack-backups-main-js' );
	}

	/**
	 * Plugin admin menu setup.
	 */
	public function admin_menu() {
		add_menu_page(
			'Jetpack Backups',
			'Backups',
			'manage_options',
			'jetpack-backups-menu',
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
			<div>
				<h1>Backups Plugin</h1>
			</div>
		<?php
	}
}

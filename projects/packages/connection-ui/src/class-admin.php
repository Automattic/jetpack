<?php
/**
 * The Connection UI Admin Area.
 *
 * @package automattic/jetpack-connection-ui
 */

namespace Automattic\Jetpack\ConnectionUI;

/**
 * The Connection UI Admin Area
 */
class Admin {

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Initialize the UI.
	 */
	public static function init() {
		add_action(
			'plugins_loaded',
			function () {
				new static();
			}
		);
	}

	/**
	 * Register's submenu.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'tools.php',
			'Connection Manager',
			'Connection Manager',
			'manage_options',
			'wpcom-connection-manager',
			array( $this, 'render_ui' ),
			4
		);
	}

	/**
	 * Enqueue scripts!
	 *
	 * @param string $hook Page hook.
	 */
	public function enqueue_scripts( $hook ) {
		if ( strpos( $hook, 'tools_page_wpcom-connection-manager' ) === 0 ) {
			$build_assets = require_once __DIR__ . '/../build/index.asset.php';
			wp_enqueue_script( 'jetpack_connection_ui_script', plugin_dir_url( __DIR__ ) . 'build/index.js', $build_assets['dependencies'], $build_assets['version'], true );

			wp_set_script_translations( 'react-jetpack_connection_ui_script', 'jetpack' );
		}
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		?>
		<div id="jetpack-connection-ui-container"></div>
		<?php
	}

}

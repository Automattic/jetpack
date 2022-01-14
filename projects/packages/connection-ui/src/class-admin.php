<?php
/**
 * The Connection UI Admin Area.
 *
 * @package automattic/jetpack-connection-ui
 */

namespace Automattic\Jetpack\ConnectionUI;

use Automattic\Jetpack\Assets;

/**
 * The Connection UI Admin Area
 */
class Admin {

	/**
	 * Construction.
	 */
	public function __construct() {
		if ( ! did_action( 'jetpack_on_connection_ui_init' ) ) {
			add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

			$this->maybe_init_idc();

			/**
			 * Action called after initializing Connection UI Admin resources.
			 *
			 * @since 1.1.0
			 */
			do_action( 'jetpack_on_connection_ui_init' );
		}
	}

	/**
	 * Initialize the UI.
	 */
	public static function init() {
		new static();
	}

	/**
	 * Register's submenu.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'tools.php',
			__( 'Connection Manager', 'jetpack-connection-ui' ),
			__( 'Connection Manager', 'jetpack-connection-ui' ),
			'read',
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
			Assets::register_script(
				'jetpack_connection_ui',
				'../build/index.js',
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack-connection-ui',
				)
			);
			Assets::enqueue_script( 'jetpack_connection_ui' );
			wp_add_inline_script( 'jetpack_connection_ui', $this->get_initial_state(), 'before' );
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

	/**
	 * Return the rendered initial state JavaScript code.
	 *
	 * @return string
	 */
	private function get_initial_state() {
		return ( new Initial_State() )->render();
	}

	/**
	 * If this is the Connection Manager UI page, activate IDC.
	 */
	private function maybe_init_idc() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! empty( $_GET['page'] ) && 'wpcom-connection-manager' === $_GET['page'] ) {
			add_action( 'plugins_loaded', array( 'Automattic\\Jetpack\\Identity_Crisis', 'init' ) );
		}
	}

}

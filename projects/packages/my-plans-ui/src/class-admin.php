<?php
/**
 * The My Plans UI Admin Area.
 *
 * @package automattic/jetpack-my-plans-ui
 */

namespace Automattic\Jetpack\MyPlansUI;

/**
 * The My Plans UI Admin Area
 */
class Admin {

	/**
	 * Construction.
	 */
	public function __construct() {
		if ( ! did_action( 'jetpack_on_my_plans_ui_init' ) ) {
			add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

			/**
			 * Action called after initializing My Plans UI Admin resources.
			 *
			 * @since 9.8.0
			 */
			do_action( 'jetpack_on_my_plans_ui_init' );
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
			'jetpack',
			__( 'My Plans', 'jetpack' ),
			__( 'My Plans', 'jetpack' ),
			'jetpack_admin_page',
			'jetpack-my-plans',
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
		if ( strpos( $hook, 'jetpack_page_jetpack-my-plans' ) === 0 ) {
			$build_assets = require_once __DIR__ . '/../build/index.asset.php';
			wp_enqueue_script( 'jetpack_my_plans_ui_script', plugin_dir_url( __DIR__ ) . 'build/index.js', $build_assets['dependencies'], $build_assets['version'], true );

			wp_set_script_translations( 'react-jetpack_my_plans_ui_script', 'jetpack' );
			wp_add_inline_script( 'jetpack_my_plans_ui_script', $this->get_initial_state(), 'before' );

			wp_enqueue_style( 'jetpack_my_plans_ui_style', plugin_dir_url( __DIR__ ) . 'build/index.css', array( 'wp-components' ), $build_assets['version'] );
			wp_style_add_data( 'jetpack_my_plans_ui_style', 'rtl', plugin_dir_url( __DIR__ ) . 'build/index.rtl.css' );
		}
	}

	/**
	 * Render UI.
	 */
	public function render_ui() {
		?>
		<div id="jetpack-my-plans-ui-container"></div>
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

}

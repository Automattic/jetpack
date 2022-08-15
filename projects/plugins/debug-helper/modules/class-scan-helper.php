<?php
/**
 * Jetpack Scan helper class.
 *
 * @package automattic/jetpack-debug-helper
 */

/**
 * Helps debug Scan
 */
class Scan_Helper {

	/**
	 * Construction.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_submenu_page' ), 1000 );

	}

	/**
	 * Add submenu item.
	 */
	public function register_submenu_page() {
		add_submenu_page(
			'jetpack-debug-tools',
			'Scan Helper',
			'Scan Helper',
			'manage_options',
			'scan-helper',
			array( $this, 'render_ui' ),
			99
		);
	}

	/**
	 * Renders the UI.
	 */
	public function render_ui() {
		echo 'Hello, World!';
	}

}

add_action(
	'plugins_loaded',
	function () {
		new Scan_Helper();
	},
	1000
);

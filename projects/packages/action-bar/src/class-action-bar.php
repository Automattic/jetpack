<?php
/**
 * Put your classes in this `src` folder!
 *
 * @package automattic/jetpack-action-bar
 */

namespace Automattic\Jetpack;

/**
 * Action_Bar class.
 */
class Action_Bar {
	/**
	 * Enqueue scripts for rendering Action Bar client.
	 */
	public function enqueue_scripts() {
		if ( is_admin() || ! is_single() ) {
			return;
		}

		Assets::register_script(
			'jetpack-action-bar',
			'build/action-bar.js',
			dirname( __DIR__ ) . DIRECTORY_SEPARATOR . 'src', // A full path to a file or a directory inside a plugin.
			array(
				'dependencies' => array( 'wp-i18n' ),
				'in_footer'    => true,
				'textdomain'   => 'jetpack-action-bar',
			)
		);
		Assets::enqueue_script( 'jetpack-action-bar' );
	}

	/**
	 * Render app container html.
	 */
	public function print_html() {
		echo '<div id="jetpack-action-bar" class="jetpack-action-bar"></div>';
	}

	/**
	 * Initialize Action Bar.
	 */
	public function init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( $this, 'print_html' ) );
	}
}

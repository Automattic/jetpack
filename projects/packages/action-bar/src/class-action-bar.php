<?php
/**
 * Put your classes in this `src` folder!
 *
 * @package automattic/jetpack-action-bar
 */
namespace Automattic\Jetpack;

class Action_Bar {
	public function enqueue_scripts() {
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

	public function print_html() {
		echo '<div id="jetpack-action-bar"></div>';
	}

	public function init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( $this, 'print_html' ) );
	}
}

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
			'../build/action-bar.js',
			__FILE__, // A full path to a file or a directory inside a plugin.
			array(
				'dependencies' => array( 'wp-i18n' ),
				'in_footer'    => true,
				'textdomain'   => 'jetpack-action-bar',
				'enqueue'      => true,
			)
		);

		$action_bar_data = 'window.WpcomActionBar = ' . wp_json_encode(
			array(
				'siteId'    => '123',
				'siteURL'   => 'example.blog',
				'siteTitle' => 'Site title',
				'nonce'     => 'nonce',
			)
		);

		wp_add_inline_script( 'jetpack-action-bar', $action_bar_data, 'before' );
	}

	/**
	 * Render app container html.
	 */
	public function print_html() {
		if ( is_admin() || ! is_single() ) {
			return;
		}

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

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
			__FILE__,
			array(
				'dependencies' => array(),
				'in_footer'    => true,
				'enqueue'      => true,
			)
		);

		wp_localize_script(
			'jetpack-action-bar',
			'jetpackActionBar',
			array(
				'commentTitle' => esc_html__( 'Leave a comment', 'jetpack-action-bar' ),
				'more'         => esc_html__( 'More options', 'jetpack-action-bar' ),
				'follow'       => esc_html__( 'Follow site', 'jetpack-action-bar' ),
				'like'         => esc_html__( 'Like this post', 'jetpack-action-bar' ),
				'report'       => esc_html__( 'Report this content', 'jetpack-action-bar' ),
				'viewSite'     => esc_html__( 'View site in reader', 'jetpack-action-bar' ),
				'manage'       => esc_html__( 'Manage subscriptions', 'jetpack-action-bar' ),
			)
		);
	}

	/**
	 * Render app container html.
	 */
	public function print_html() {
		if ( is_admin() || ! is_single() ) {
			return;
		}
		echo '<link rel="stylesheet" href="https://widgets.wp.com/jetpack-action-bar/style.css"></link>';
		echo '<script type="text/javascript" src="https://widgets.wp.com/jetpack-action-bar/index.js"></script>';
		echo '<div id="jetpack-action-bar" class="jetpack-action-bar"></div>';
		echo '<div id="jetpack-action-bar-modal" class="jetpack-action-bar-modal"></div>';
	}

	/**
	 * Initialize Action Bar.
	 */
	public function init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( $this, 'print_html' ) );
	}
}

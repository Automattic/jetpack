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
	}

	/**
	 * Render app container html.
	 */
	public function print_html() {
		if ( is_admin() || ! is_single() ) {
			return;
		}

			$post_id = get_the_ID();

		if ( ! is_numeric( $post_id ) ) {
			return;
		}

		$protocol = 'http';
		if ( is_ssl() ) {
			$protocol = 'https';
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id  = get_current_blog_id();
			$bloginfo = get_blog_details( (int) $blog_id );
			$domain   = $bloginfo->domain;
		} else {
			$blog_id   = \Jetpack_Options::get_option( 'id' );
			$url       = home_url();
			$url_parts = wp_parse_url( $url );
			$domain    = $url_parts['host'];
		}

			$src = sprintf( 'https://widgets.wp.com/action-bar/#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%1$s://%4$s', $protocol, $blog_id, $post_id, $domain );

			echo '<div class="jetpack-action-bar"><iframe class="jetpack-action-bar-widget" scrolling="no" frameBorder="0" name="jetpack-action-bar-widget" src="' . esc_url( $src ) . '"></iframe></div>';
	}

	/**
	 * Initialize Action Bar.
	 */
	public function init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_footer', array( $this, 'print_html' ) );
	}
}

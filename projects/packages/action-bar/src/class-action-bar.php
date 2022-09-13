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

		// TODO: do we need to encode the urls? Also postUrls with query params won't currently be parsed correctly by splitParams in the iframe.
		// TODO: add favicon in some way.
		$settings = array(
			'readerUrl=' . $this->get_reader_url(),
			'isWpcom=' . defined( 'IS_WPCOM' ) && IS_WPCOM,
			'siteHost=' . wp_parse_url( get_option( 'home' ), PHP_URL_HOST ),
			'postUrl=' . get_permalink( get_the_ID() ),
		);

		// TODO: combine these more cleanly.
		$src  = sprintf( 'https://widgets.wp.com/jetpack-action-bar/#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%1$s://%4$s', $protocol, $blog_id, $post_id, $domain );
		$src .= '&amp;' . implode( '&amp;', $settings );

		echo '<div class="jetpack-action-bar">';
		echo '	<iframe class="jetpack-action-bar-widget" scrolling="no" frameBorder="0" name="jetpack-action-bar-widget" src="' . esc_url( $src ) . '">';
		echo '	</iframe>';
		echo '</div>';
	}

	/**
	 * Initialize Action Bar.
	 */
	public function init() {
		add_action( 'wp_footer', array( $this, 'print_html' ) );
	}

	/**
	 * Gets the url for the sites reader feed.
	 */
	private function get_reader_url() {
		$site_id = get_current_blog_id();
		$feed_id = null;
		if ( class_exists( 'FeedBag' ) ) {
			$feed_id = FeedBag::get_feed_id_for_blog_id( $site_id );
		}
		if ( $feed_id ) {
			return 'https://wordpress.com/read/feeds/' . esc_attr( $feed_id );
		} else {
			return 'https://wordpress.com/read/blogs/' . esc_attr( $site_id );
		}
	}
}

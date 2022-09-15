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

		wp_register_script(
			'jetpack-action-bar',
			'https://widgets.wp.com/jetpack-action-bar/index.js',
			array(),
			JETPACK__VERSION,
			true
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
				'readerUrl'    => $this->get_reader_url(),
				'isWpcom'      => defined( 'IS_WPCOM' ) && IS_WPCOM,
				'siteHost'     => wp_parse_url( get_option( 'home' ), PHP_URL_HOST ),
				'postUrl'      => get_post_permalink( get_the_ID() ),
			)
		);
		wp_enqueue_script( 'jetpack-action-bar' );

		wp_enqueue_style(
			'jetpack-action-bar-style',
			'https://widgets.wp.com/jetpack-action-bar/style.css',
			array(),
			JETPACK__VERSION
		);
	}

	/**
	 * Render app container html.
	 */
	public function print_html() {
		if ( is_admin() || ! is_single() ) {
			return;
		}
		echo '<div class="jetpack-action-bar-container">';
		echo '	<div id="jetpack-action-bar" class="jetpack-action-bar"></div>';
		echo '	<div id="jetpack-action-bar-modal" class="jetpack-action-bar-modal"></div>';
		echo '</div>';
	}

	/**
	 * Initialize Action Bar.
	 */
	public function init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
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

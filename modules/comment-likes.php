<?php
/**
 * Module Name: Comment Likes
 * Module Description: Inrease visitor engagement by adding a Like button to comments.
 * Sort Order: 38
 * Recommendation Order: 16
 * First Introduced: 4.9
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: General
 * Additional Search Queries: like widget
 */

Jetpack::dns_prefetch( array(
	'//widgets.wp.com',
	'//s0.wp.com',
	'//s1.wp.com',
	'//s2.wp.com',
	'//0.gravatar.com',
	'//1.gravatar.com',
	'//2.gravatar.com',
) );

require_once dirname( __FILE__ ) . '/likes/jetpack-likes-master-iframe.php';

class Jetpack_Comment_Likes {
	public static function init() {
		static $instance = NULL;

		if ( ! $instance ) {
			$instance = new Jetpack_Comment_Likes;
		}

		return $instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'frontend_init' ) );
	}

	public function frontend_init() {
		if ( is_admin() ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( $this, 'load_styles_register_scripts' ) );
		add_filter( 'comment_text', array( $this, 'comment_likes' ), 10, 2 );
	}

	public function load_styles_register_scripts() {
		wp_enqueue_style( 'jetpack_likes', plugins_url( 'likes/style.css', __FILE__ ), array(), JETPACK__VERSION );
		wp_enqueue_script( 'postmessage', plugins_url( '_inc/postmessage.js', dirname(__FILE__) ), array( 'jquery' ), JETPACK__VERSION, false );
		wp_enqueue_script( 'jquery_inview', plugins_url( '_inc/jquery.inview.js', dirname(__FILE__) ), array( 'jquery' ), JETPACK__VERSION, false );
		wp_enqueue_script( 'jetpack_resize', plugins_url( '_inc/jquery.jetpack-resize.js' , dirname(__FILE__) ), array( 'jquery' ), JETPACK__VERSION, false );
		wp_enqueue_script( 'jetpack_likes_queuehandler', plugins_url( 'likes/queuehandler.js' , __FILE__ ), array( 'jquery', 'postmessage', 'jetpack_resize', 'jquery_inview' ), JETPACK__VERSION, true );
	}

	public function comment_likes( $content, $comment = null ) {
		if ( empty( $comment ) ) {
			return $content;
		}

		$blog_id   = Jetpack_Options::get_option( 'id' );
		$url       = home_url();
		$url_parts = parse_url( $url );
		$domain    = $url_parts['host'];

		$comment_id = get_comment_ID();
		if ( empty( $comment_id ) && ! empty( $comment->comment_ID ) ) {
			$comment_id = $comment->comment_ID;
		}

		if ( empty( $content ) || empty( $comment_id ) ) {
			return $content;
		}

		// In case master iframe hasn't been loaded. This could be the case when Post Likes module is disabled,
		// or on pages on which we have comments but post likes are disabled.
		if ( ! has_action( 'wp_footer', 'jetpack_likes_master_iframe' ) ) {
			add_action( 'wp_footer', 'jetpack_likes_master_iframe', 21 );
		}

		$uniqid = uniqid();

		$src     = sprintf( '//widgets.wp.com/likes/#blog_id=%1$d&amp;comment_id=%2$d&amp;origin=%3$s&amp;obj_id=%1$d-%2$d-%4$s', $blog_id, $comment_id, $domain, $uniqid );
		$name    = sprintf( 'like-comment-frame-%1$d-%2$d-%3$s', $blog_id, $comment_id, $uniqid );
		$wrapper = sprintf( 'like-comment-wrapper-%1$d-%2$d-%3$s', $blog_id, $comment_id, $uniqid );

		$html[] = "<div class='jetpack-comment-likes-widget-wrapper jetpack-likes-widget-unloaded' id='$wrapper' data-src='$src' data-name='$name'>";
		$html[] = "<div class='likes-widget-placeholder comment-likes-widget-placeholder comment-likes'><span class=\"loading\">" . esc_html__( 'Loading...', 'jetpack' ) . "</span> </div>";
		$html[] = "<div class='comment-likes-widget jetpack-likes-widget comment-likes'><span class='comment-like-feedback'></span>";
		$html[] = "<span class='sd-text-color'></span><a class='sd-link-color'></a>";
		$html[] = '</div></div>';

		// Filter and finalize the comment like button
		$like_button = apply_filters( 'comment_like_button', implode( '', $html ), '' );

		return $content . $like_button;
	}
}

Jetpack_Comment_Likes::init();

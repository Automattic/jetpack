<?php
/**
 * Module Name: AMP
 * Module Description: Add AMP support for Jetpack features
 * Sort Order: 40
 * Recommendation Order: 18
 * First Introduced: 6.2.0
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: AMP
 * Feature: Traffic
 * Additional Search Queries: amp, performance, mobile
 */

/**
 * TODO:
 * * prompt to sideload AMP plugin
 * * gutenberg support?
 * * etc.
 */

class Jetpack_AMP {
	/**
	 * @var Jetpack_AMP
	 */
	private static $__instance = null;
	private $is_amp_request_cache = null;

	/**
	 * Singleton implementation
	 *
	 * @return Jetpack_AMP
	 */
	public static function instance() {
		if ( is_null( self::$__instance ) ) {
			self::$__instance = new Jetpack_AMP;
		}

		return self::$__instance;
	}

	private function __construct() {
		add_action( 'template_redirect', array( $this, 'disable_comment_likes' ) );
		add_action( 'template_redirect', array( $this, 'disable_likes' ) );
		add_action( 'wp', array( $this, 'disable_related_posts' ), 1 );
	}

	private function is_amp_request() {
		if ( is_null( $this->is_amp_request_cache ) ) {
			$this->is_amp_request_cache = is_amp_endpoint();
		}

		return $this->is_amp_request_cache;
	}

	public function disable_comment_likes() {
		if ( ! $this->is_amp_request() || ! Jetpack::is_module_active( 'comment-likes' ) ) {
			return;
		}

		$module = Jetpack_Comment_Likes::init();

		// Undo \Jetpack_Comment_Likes::frontend_init().
		remove_action( 'wp_enqueue_scripts', array( $module, 'load_styles_register_scripts' ) );
		remove_filter( 'comment_text', array( $module, 'comment_likes' ) );
	}

	public function disable_likes() {
		if ( ! $this->is_amp_request() || ! Jetpack::is_module_active( 'likes' ) ) {
			return;
		}

		$module = Jetpack_Likes::init();

		// Undo \Jetpack_Likes::action_init().
		remove_filter( 'the_content', array( $module, 'post_likes' ), 30 );
		remove_filter( 'the_excerpt', array( $module, 'post_likes' ), 30 );
		remove_filter( 'post_flair', array( $module, 'post_likes' ), 30 );
		remove_filter( 'post_flair_block_css', array( $module, 'post_flair_service_enabled_like' ) );
		wp_dequeue_script( 'postmessage' );
		wp_dequeue_script( 'jetpack_resize' );
		wp_dequeue_script( 'jetpack_likes_queuehandler' );
		wp_dequeue_style( 'jetpack_likes' );
	}

	// Disable Related Posts since not available in AMP.
	public function disable_related_posts() {
		if ( ! $this->is_amp_request() || ! Jetpack::is_module_active( 'related-posts' ) ) {
			return;
		}
		add_filter( 'jetpack_relatedposts_filter_enabled_for_request', '__return_false' );
	}
}

if ( function_exists( 'is_amp_endpoint' ) ) {
	Jetpack_AMP::instance();
}


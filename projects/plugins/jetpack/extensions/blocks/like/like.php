<?php
/**
 * Like Block.
 *
 * @since 12.9
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Like;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Load scripts and styles for front end.
 */
function load_styles_register_scripts() {
	wp_enqueue_style( 'jetpack_likes', plugins_url( 'likes/style.css', __FILE__ ), array(), JETPACK__VERSION );
	wp_register_script(
		'jetpack_likes_queuehandler',
		Assets::get_file_url_for_environment(
			'_inc/build/likes/queuehandler.min.js',
			'modules/likes/queuehandler.js'
		),
		array(),
		JETPACK__VERSION,
		true
	);
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'api_version'     => 3,
			'render_callback' => __NAMESPACE__ . '\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Like block render function.
 *
 * @param array  $attr Array containing the Like block attributes.
 * @param string $content String containing the Like block content.
 * @param object $block Object containing the Like block data.
 *
 * @return string
 */
function render_block( $attr, $content, $block ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$html = '';

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id = get_current_blog_id();
	} else {
		$blog_id   = \Jetpack_Options::get_option( 'id' );
		$url       = home_url();
		$url_parts = wp_parse_url( $url );
		$domain    = $url_parts['host'];
	}

	$post_id = $block->context['postId'];

	$uniqid = uniqid();
	/**
	 * Enable an alternate Likes layout.
	 *
	 * @since 12.9
	 *
	 * @module likes
	 *
	 * @param bool $new_layout Enable the new Likes layout. False by default.
	 */
	$new_layout = apply_filters( 'likes_new_layout', true ) ? '&amp;n=1' : '';

	$src      = sprintf( 'https://widgets.wp.com/likes/#blog_id=%1$d&amp;post_id=%2$d&amp;origin=%3$s&amp;obj_id=%1$d-%2$d-%4$s%5$s', $blog_id, $post_id, $domain, $uniqid, $new_layout );
	$name     = sprintf( 'like-post-frame-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );
	$wrapper  = sprintf( 'like-post-wrapper-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );
	$headline = sprintf(
		/** This filter is already documented in modules/sharedaddy/sharing-service.php */
		apply_filters( 'jetpack_sharing_headline_html', '<h3 class="sd-title">%s</h3>', esc_html__( 'Like this:', 'jetpack' ), 'likes' ),
		esc_html__( 'Like this:', 'jetpack' )
	);

	$title = esc_html__( 'Like or Reblog', 'jetpack' );

	$html  = "<div class='sharedaddy sd-block sd-like jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded' id='$wrapper' data-src='$src' data-name='$name' data-title='$title'>";
	$html .= $headline;
	$html .= "<div class='likes-widget-placeholder post-likes-widget-placeholder' style='height: 55px;'><span class='button'><span>" . esc_html__( 'Like', 'jetpack' ) . '</span></span> <span class="loading">' . esc_html__( 'Loading...', 'jetpack' ) . '</span></div>';
	$html .= "<span class='sd-text-color'></span><a class='sd-link-color'></a>";
	$html .= '</div>';

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$html
	);
}

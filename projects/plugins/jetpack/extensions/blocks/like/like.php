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
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	$is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;

	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'api_version'     => 3,
			'render_callback' => __NAMESPACE__ . '\render_block',
			'description'     => $is_wpcom ? __( 'Give your readers the ability to show appreciation for your posts and easily share them with others.', 'jetpack' ) : __( 'Give your readers the ability to show appreciation for your posts.', 'jetpack' ),
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

	$uniqid  = uniqid();
	$post_id = $block->context['postId'];
	$title   = esc_html__( 'Like or Reblog', 'jetpack' );

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

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id  = get_current_blog_id();
		$bloginfo = get_blog_details( (int) $blog_id );
		$domain   = $bloginfo->domain;
		$version  = '20231201';
		$src      = sprintf( '//widgets.wp.com/likes/index.html?ver=%1$d#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%4$s&amp;obj_id=%2$d-%3$d-%5$s%6$s', $version, $blog_id, $post_id, $domain, $uniqid, $new_layout );
		$headline = '';

		// provide the mapped domain when needed
		if ( isset( $_SERVER['HTTP_HOST'] ) && strpos( sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ), '.wordpress.com' ) === false ) {
			$sanitized_host = filter_var( wp_unslash( $_SERVER['HTTP_HOST'] ), FILTER_SANITIZE_URL );
			$src           .= '&amp;domain=' . rawurlencode( $sanitized_host );
		}
	} else {
		$blog_id   = \Jetpack_Options::get_option( 'id' );
		$url       = home_url();
		$url_parts = wp_parse_url( $url );
		$domain    = $url_parts['host'];
		$src       = sprintf( 'https://widgets.wp.com/likes/#blog_id=%1$d&amp;post_id=%2$d&amp;origin=%3$s&amp;obj_id=%1$d-%2$d-%4$s%5$s', $blog_id, $post_id, $domain, $uniqid, $new_layout );
		$headline  = sprintf(
			/** This filter is already documented in modules/sharedaddy/sharing-service.php */
			apply_filters( 'jetpack_sharing_headline_html', '<h3 class="sd-title">%s</h3>', esc_html__( 'Like this:', 'jetpack' ), 'likes' ),
			esc_html__( 'Like this:', 'jetpack' )
		);
	}

	$name    = sprintf( 'like-post-frame-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );
	$wrapper = sprintf( 'like-post-wrapper-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );

	$html = "<div class='sharedaddy sd-block sd-like jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded' id='" . esc_attr( $wrapper ) . "' data-src='" . esc_attr( $src ) . "' data-name='" . esc_attr( $name ) . "' data-title='" . esc_attr( $title ) . "'>"
		. $headline
		. "<div class='likes-widget-placeholder post-likes-widget-placeholder' style='height: 55px;'><span class='button'><span>" . esc_html__( 'Like', 'jetpack' ) . "</span></span> <span class='loading'>" . esc_html__( 'Loading...', 'jetpack' ) . '</span></div>'
		. "<span class='sd-text-color'></span><a class='sd-link-color'></a>"
		. '</div>';

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$html
	);
}

/**
 * Add the initial state for the Like block.
 */
function add_like_block_data() {
	if ( ! is_admin() ) {
		return;
	}

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id = get_current_blog_id();
	} else {
		$blog_id = \Jetpack_Options::get_option( 'id' );
	}

	$like_block_data = array(
		'blog_id' => $blog_id,
	);

	wp_add_inline_script(
		'jetpack-blocks-editor',
		'var Jetpack_LikeBlock = ' . wp_json_encode( $like_block_data, JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
		'before'
	);
}
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\add_like_block_data' );

<?php
/**
 * Like Block.
 *
 * @since 12.9
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Like;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status\Request;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	$is_wpcom     = defined( 'IS_WPCOM' ) && IS_WPCOM;
	$is_connected = \Jetpack::is_connection_ready();

	if ( $is_wpcom || $is_connected ) {
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'api_version'     => 3,
				'render_callback' => __NAMESPACE__ . '\render_block',
				'description'     => $is_wpcom ? __( 'Give your readers the ability to show appreciation for your posts and easily share them with others.', 'jetpack' ) : __( 'Give your readers the ability to show appreciation for your posts.', 'jetpack' ),
			)
		);
	}
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
	// Do not render the Like block in other context than front-end (i.e. feed, emails, API, etc.).
	if ( ! Request::is_frontend() ) {
		return;
	}

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$html = '';

	$uniqid  = uniqid();
	$post_id = $block->context['postId'] ?? null;
	$title   = esc_html__( 'Like or Reblog', 'jetpack' );

	if ( ! $post_id ) {
		return;
	}

	// make sure we have `jetpack_likes_master_iframe` defined
	require_once JETPACK__PLUGIN_DIR . 'modules/likes/jetpack-likes-master-iframe.php';

	if ( ! has_action( 'wp_footer', 'jetpack_likes_master_iframe' ) ) {
		add_action( 'wp_footer', 'jetpack_likes_master_iframe', 21 );
	}

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$style_url  = content_url( 'mu-plugins/likes/jetpack-likes.css' );
		$script_url = content_url( 'mu-plugins/likes/queuehandler.js' );
	} else {
		$style_url  = plugins_url( 'modules/likes/style.css', dirname( __DIR__, 2 ) );
		$script_url = Assets::get_file_url_for_environment(
			'_inc/build/likes/queuehandler.min.js',
			'modules/likes/queuehandler.js'
		);
	}
	wp_enqueue_script( 'jetpack_likes_queuehandler', $script_url, array(), JETPACK__VERSION, true );
	wp_enqueue_style( 'jetpack_likes', $style_url, array(), JETPACK__VERSION );

	$show_reblog_button = $attr['showReblogButton'] ?? false;
	$show_avatars       = $attr['showAvatars'] ?? true;
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id            = get_current_blog_id();
		$bloginfo           = get_blog_details( (int) $blog_id );
		$domain             = $bloginfo->domain;
		$reblog_param       = $show_reblog_button ? '&amp;reblog=1' : '';
		$show_avatars_param = $show_avatars ? '' : '&amp;slim=1';
		$src                = sprintf( 'https://widgets.wp.com/likes/index.html?ver=%1$s#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%4$s&amp;obj_id=%2$d-%3$d-%5$s%6$s%7$s&amp;block=1', rawurlencode( JETPACK__VERSION ), $blog_id, $post_id, $domain, $uniqid, $reblog_param, $show_avatars_param );

		// provide the mapped domain when needed
		if ( isset( $_SERVER['HTTP_HOST'] ) && strpos( sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ), '.wordpress.com' ) === false ) {
			$sanitized_host = filter_var( wp_unslash( $_SERVER['HTTP_HOST'] ), FILTER_SANITIZE_URL );
			$src           .= '&amp;domain=' . rawurlencode( $sanitized_host );
		}
	} else {
		$blog_id            = \Jetpack_Options::get_option( 'id' );
		$url                = home_url();
		$url_parts          = wp_parse_url( $url );
		$domain             = $url_parts['host'];
		$show_avatars_param = $show_avatars ? '' : '&amp;slim=1';
		$src                = sprintf( 'https://widgets.wp.com/likes/index.html?ver=%1$s#blog_id=%2$d&amp;post_id=%3$d&amp;origin=%4$s&amp;obj_id=%2$d-%3$d-%5$s%6$s&amp;block=1', rawurlencode( JETPACK__VERSION ), $blog_id, $post_id, $domain, $uniqid, $show_avatars_param );
	}

	$name    = sprintf( 'like-post-frame-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );
	$wrapper = sprintf( 'like-post-wrapper-%1$d-%2$d-%3$s', $blog_id, $post_id, $uniqid );

	$html = "<div class='sharedaddy sd-block sd-like jetpack-likes-widget-wrapper jetpack-likes-widget-unloaded' id='" . esc_attr( $wrapper ) . "' data-src='" . esc_attr( $src ) . "' data-name='" . esc_attr( $name ) . "' data-title='" . esc_attr( $title ) . "'>"
		. "<div class='likes-widget-placeholder post-likes-widget-placeholder' style='height: 55px;'><span class='loading'>" . esc_html__( 'Loading…', 'jetpack' ) . '</span></div>'
		. "<span class='sd-text-color'></span><a class='sd-link-color'></a>"
		. '</div>';
	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$html
	);
}

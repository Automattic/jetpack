<?php
/**
 * Adds a wrapper to videos and enqueue script
 *
 * @return string
 */
function jetpack_responsive_videos_embed_html( $html ) {
	if ( empty( $html ) || ! is_string( $html ) ) {
		return $html;
	}

	wp_enqueue_script( 'jetpack-responsive-videos-script', plugins_url( 'responsive-videos.js', __FILE__ ), array( 'jquery' ), '1.1', true );

	return '<div class="jetpack-video-wrapper">' . $html . '</div>';
}
add_filter( 'wp_video_shortcode', 'jetpack_responsive_videos_embed_html' );
add_filter( 'embed_oembed_html',  'jetpack_responsive_videos_embed_html' );
add_filter( 'video_embed_html',   'jetpack_responsive_videos_embed_html' );
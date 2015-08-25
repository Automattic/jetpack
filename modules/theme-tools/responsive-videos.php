<?php
/**
 * Load the Responsive videos plugin
 */
function jetpack_responsive_videos_init() {

	/* If the doesn't theme support 'jetpack-responsive-videos', don't continue */
	if ( ! current_theme_supports( 'jetpack-responsive-videos' ) ) {
		return;
	}

	/* If the theme does support 'jetpack-responsive-videos', wrap the videos */
	add_filter( 'wp_video_shortcode', 'jetpack_responsive_videos_embed_html' );
	add_filter( 'video_embed_html',   'jetpack_responsive_videos_embed_html' );
	add_filter( 'wp_embed_handler_youtube', 'jetpack_responsive_videos_embed_html' );

	/* Only wrap oEmbeds if YouTube or Vimeo */
	add_filter( 'embed_oembed_html',  'jetpack_responsive_videos_maybe_wrap_oembed', 10, 2 );

	/* Wrap videos in Buddypress */
	add_filter( 'bp_embed_oembed_html', 'jetpack_responsive_videos_embed_html' );
}
add_action( 'after_setup_theme', 'jetpack_responsive_videos_init', 99 );

/**
 * Adds a wrapper to videos and enqueue script
 *
 * @return string
 */
function jetpack_responsive_videos_embed_html( $html ) {
	if ( empty( $html ) || ! is_string( $html ) ) {
		return $html;
	}

	if ( defined( 'SCRIPT_DEBUG' ) && true == SCRIPT_DEBUG ) {
		wp_enqueue_script( 'jetpack-responsive-videos-script', plugins_url( 'responsive-videos/responsive-videos.js', __FILE__ ), array( 'jquery' ), '1.1', true );
	} else {
		wp_enqueue_script( 'jetpack-responsive-videos-min-script', plugins_url( 'responsive-videos/responsive-videos.min.js', __FILE__ ), array( 'jquery' ), '1.1', true );
	}

	// Enqueue CSS to ensure compatibility with all themes
	wp_register_style( 'jetpack-responsive-videos-style', plugins_url( 'responsive-videos/responsive-videos.css', __FILE__ ) );
	wp_enqueue_style( 'jetpack-responsive-videos-style' );

	return '<div class="jetpack-video-wrapper">' . $html . '</div>';
}

/**
 * Check if oEmbed is YouTube or Vimeo before wrapping.
 *
 * @return string
 */
function jetpack_responsive_videos_maybe_wrap_oembed( $html, $url ) {
	if ( empty( $html ) || ! is_string( $html ) || ! $url ) {
		return $html;
	}

	$is_vimeo = $is_youtube = false;
	$yt_pattern = '#^https?://(?:www\.)?(?:youtube\.com/watch|youtu\.be/)#';
	$vimeo_pattern = '#^https?://(.+\.)?vimeo\.com/.*#';

	$is_vimeo = ( preg_match( $vimeo_pattern, $url ) );
	$is_youtube = ( preg_match( $yt_pattern, $url ) );

	if ( $is_vimeo || $is_youtube ) {
		return jetpack_responsive_videos_embed_html( $html );
	}

	return $html;
}
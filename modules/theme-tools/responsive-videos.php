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
	
	/* Check to make sure the content is a video before applying to oEmbeds */
	if ( ! empty( get_media_embedded_in_content( 'video' ) ) ) {
		add_filter( 'embed_oembed_html',  'jetpack_responsive_videos_embed_html' );
	}
	
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

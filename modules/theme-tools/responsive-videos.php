<?php
/**
 * Load the Responsive videos plugin
 */

/* Function for including files that the theme supports. */
function jetpack_responsive_videos_init() {

	/* If the theme supports 'jetpack-responsive-videos', include the responsive videos plugin */
	require_if_theme_supports( 'jetpack-responsive-videos', dirname( __FILE__ ) . '/responsive-videos/responsive-videos.php' );

}
add_action( 'after_setup_theme', 'jetpack_responsive_videos_init', 99 );

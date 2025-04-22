<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package automattic/jetpack
 */

/**
 * Removes sharing markup from post content if we're not in the loop and it's a
 * formatted post.
 *
 * @param bool    $show Whether to show sharing options.
 * @param WP_Post $post The post to share.
 * @return bool
 */
function twentyfourteen_mute_content_filters( $show, $post ) {
	$formats = get_theme_support( 'post-formats' );
	if ( ! in_the_loop() && has_post_format( $formats[0], $post ) ) {
		$show = false;
	}
	return $show;
}
add_filter( 'sharing_show', 'twentyfourteen_mute_content_filters', 10, 2 );

/**
 * Enqueue Jetpack compat styles for Twenty Fourteen.
 */
function twentyfourteen_init_jetpack() {
	/**
	 * Add our compat CSS file for custom widget stylings and such.
	 * Set the version equal to filemtime for development builds, and the JETPACK__VERSION for production.
	 */
	if ( ! is_admin() ) {
		$version = false;
		if ( method_exists( 'Jetpack', 'is_development_version' ) ) {
			$version = Jetpack::is_development_version() ? filemtime( plugin_dir_path( __FILE__ ) . 'twentyfourteen.css' ) : JETPACK__VERSION;
		}
		wp_enqueue_style( 'twentyfourteen-jetpack', plugins_url( 'twentyfourteen.css', __FILE__ ), array(), $version );
		wp_style_add_data( 'twentyfourteen-jetpack', 'rtl', 'replace' );
	}
}
add_action( 'init', 'twentyfourteen_init_jetpack' );

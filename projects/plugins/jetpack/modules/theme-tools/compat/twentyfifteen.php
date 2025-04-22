<?php
/**
 * Jetpack Compatibility File
 * See: https://jetpack.com/
 *
 * @package automattic/jetpack
 */

/**
 * Enqueue Jetpack compat styles for Twenty Fifteen.
 */
function twentyfifteen_init_jetpack() {
	/**
	 * Add our compat CSS file for custom widget stylings and such.
	 * Set the version equal to filemtime for development builds, and the JETPACK__VERSION for production
	 * or skip it entirely for wpcom.
	 */
	if ( ! is_admin() ) {
		$version = false;
		if ( method_exists( 'Jetpack', 'is_development_version' ) ) {
			$version = Jetpack::is_development_version() ? filemtime( plugin_dir_path( __FILE__ ) . 'twentyfifteen.css' ) : JETPACK__VERSION;
		}
		wp_enqueue_style( 'twentyfifteen-jetpack', plugins_url( 'twentyfifteen.css', __FILE__ ), array(), $version );
		wp_style_add_data( 'twentyfifteen-jetpack', 'rtl', 'replace' );
	}
}
add_action( 'init', 'twentyfifteen_init_jetpack' );

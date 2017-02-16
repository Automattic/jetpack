<?php
/**
 * Jetpack Compatibility File
 * See: http://jetpack.com/
 *
 * @package Jetpack
 */

/**
 * Add support for Jetpack Theme features.
 */
function twentyseventeen_jetpack_setup() {
	/**
	 * Add theme support for Responsive Videos.
	 */
	add_theme_support( 'jetpack-responsive-videos' );
}
add_action( 'after_setup_theme', 'twentyseventeen_jetpack_setup' );

/**
 * Enqueue our compatibility stylesheet.
 */
function twentyseventeen_init_jetpack() {
	/**
	 * Add our compat CSS file for custom widget stylings and such.
	 * Set the version equal to filemtime for development builds, and the JETPACK__VERSION for production
	 * or skip it entirely for wpcom.
	 */
	if ( ! is_admin() ) {
		$version = false;
		if ( method_exists( 'Jetpack', 'is_development_version' ) ) {
			$version = Jetpack::is_development_version() ? filemtime( plugin_dir_path( __FILE__ ) . 'twentyseventeen.css' ) : JETPACK__VERSION;
		}
		wp_enqueue_style( 'twentyseventeen-jetpack', plugins_url( 'twentyseventeen.css', __FILE__ ), array(), $version );
		wp_style_add_data( 'twentyseventeen-jetpack', 'rtl', 'replace' );
	}
}
add_action( 'init', 'twentyseventeen_init_jetpack' );

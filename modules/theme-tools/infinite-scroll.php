<?php
/**
* INFINITE SCROLL
*/

/**
* Load theme's infinite scroll annotation file, if present in the IS plugin.
* The `setup_theme` action is used because the annotation files should be using `after_setup_theme` to register support for IS.
*
* As released in Jetpack 2.0, a child theme's parent wasn't checked for in the plugin's bundled support, hence the convoluted way the parent is checked for now.
*
* @uses is_admin, wp_get_theme, get_theme, get_current_theme, apply_filters
* @action setup_theme
* @return null
*/
function jetpack_load_infinite_scroll_annotation() {
	if ( is_admin() && isset( $_GET['page'] ) && 'jetpack' == $_GET['page'] ) {
			$theme = function_exists( 'wp_get_theme' ) ? wp_get_theme() : get_theme( get_current_theme() );

		if ( ! is_a( $theme, 'WP_Theme' ) && ! is_array( $theme ) )
			return;

		/**
		 * Filter the directory where all Infinite Scroll compat files are located.
		 *
		 * @since 2.0.0
		 *
		 * @param string $var Infinite Scroll compat file URL.
		 * @param string $theme['Stylesheet'] Theme directory URI.
		 */
		$customization_file = apply_filters( 'infinite_scroll_customization_file', dirname( __FILE__ ) . "/infinite-scroll/themes/{$theme['Stylesheet']}.php", $theme['Stylesheet'] );

		if ( is_readable( $customization_file ) ) {
			require_once( $customization_file );
		} elseif ( ! empty( $theme['Template'] ) ) {
			$customization_file = dirname( __FILE__ ) . "/infinite-scroll/themes/{$theme['Template']}.php";

			if ( is_readable( $customization_file ) )
				require_once( $customization_file );
		}
	}
}
add_action( 'setup_theme', 'jetpack_load_infinite_scroll_annotation' );

/**
* Prevent IS from being activated if theme doesn't support it
*
* @param bool $can_activate
* @filter jetpack_can_activate_infinite-scroll
* @return bool
*/
function jetpack_can_activate_infinite_scroll( $can_activate ) {
	return (bool) current_theme_supports( 'infinite-scroll' );
}
add_filter( 'jetpack_can_activate_infinite-scroll', 'jetpack_can_activate_infinite_scroll' );

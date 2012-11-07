<?php
/*
 * Load module code that is needed even when a module isn't active.
 * For example, if a module shouldn't be activatable unless certain conditions are met, the code belongs in this file.
 */

/**
 * INFINITE SCROLL
 */

/**
 * Load theme's infinite scroll annotation file, if present in the IS plugin.
 * The `setup_theme` action is used because the annotation files should be using `after_setup_theme` to register support for IS.
 *
 * @uses is_admin, get_stylesheet, apply_filters
 * @action setup_theme
 * @return null
 */
function jetpack_load_infinite_scroll_annotation() {
	if ( is_admin() && isset( $_GET['page'] ) && 'jetpack' == $_GET['page'] ) {
		$theme_name = get_stylesheet();

		$customization_file = apply_filters( 'infinite_scroll_customization_file', dirname( __FILE__ ) . "/infinite-scroll/themes/{$theme_name}.php", $theme_name );

		if ( is_readable( $customization_file ) )
			require_once( $customization_file );
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
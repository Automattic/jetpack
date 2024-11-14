<?php
/**
 * Jetpack Stats.
 *
 * @package wpcomsh
 */

/**
 * Extends the default value for which roles can access the Stats menu item.
 *
 * This enables the `view_stats` capability to work with all roles that are available on Simple sites.
 *
 * @see https://github.com/Automattic/jetpack/pull/33255
 * @see Automattic\Jetpack\Stats\Options::get_defaults()
 *
 * @param array $default_value The default value for stats options.
 * @return array
 */
function wpcomsh_extend_stats_menu_item_access( $default_value ) {
	if ( is_array( $default_value ) ) {
		$default_value['roles'] = array( 'administrator', 'editor', 'author', 'contributor' );
	}

	return $default_value;
}
add_filter( 'default_option_stats_options', 'wpcomsh_extend_stats_menu_item_access' );

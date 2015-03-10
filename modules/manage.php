<?php
/**
 * Module Name: Manage
 * Module Description: Manage all your sites from a centralized place, https://wordpress.com/sites.
 * Sort Order: 1
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Module Tags: Centralized Management
 */

add_action( 'jetpack_activate_module_manage', array( Jetpack::init(), 'toggle_module_on_wpcom' ) );
add_action( 'jetpack_deactivate_module_manage', array( Jetpack::init(), 'toggle_module_on_wpcom' )  );

$theme_slug = get_option( 'stylesheet' );

Jetpack_Sync::sync_options( __FILE__,
	'stylesheet',
	"theme_mods_{$theme_slug}",
	'jetpack_sync_non_public_post_stati',
	'jetpack_options'
);

foreach( Jetpack_Options::get_option_names( 'non-compact' ) as $option ) {
	Jetpack_Sync::sync_options( __FILE__, 'jetpack_' . $option );
}
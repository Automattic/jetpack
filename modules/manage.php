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

Jetpack_Sync::sync_constant( 'EMPTY_TRASH_DAYS' );

Jetpack_Sync::sync_mock_option( 'single_user_site', 'jetpack_is_single_user_site' );

if ( Jetpack_Options::get_option( 'sync_non_public_post_stati' ) ) {
	$sync_options = array(
		'post_types' => get_post_types( array( 'public' => true ) ),
		'post_stati' => get_post_stati(),
	);
	Jetpack_Sync::sync_posts( __FILE__, $sync_options );
}

/**
 * Get back if the current site is single user site.
 *
 * @return string '1' or '' - ( It can't return false );
 */
function jetpack_is_single_user_site() {

	$blog_id = get_current_blog_id();
	$users = get_transient( 'site_user_count'.$blog_id );
	if ( false === $users ) {
	    $user_query = new WP_User_Query( array(
	        'blog_id' => $blog_id,
	        'fields'  => 'ID',
	    ) );
	    $users = (int) $user_query->get_total();
	   set_transient( 'site_user_count'.$blog_id, $users,  DAY_IN_SECONDS );
	}
	return ( $users > 1 ? '1' : '' );

}
// Update the settings everytime the we register a new user to the site or we delete a user.
add_action( 'user_register', 'jetpack_is_single_user_site_invalidate' );
add_action( 'deleted_user', 'jetpack_is_single_user_site_invalidate' );
/**
 * Invalides the transient as well as triggers the update of the mock option.
 *
 * @return null
 */
function jetpack_is_single_user_site_invalidate() {
	delete_transient( 'site_user_count'. get_current_blog_id() );
	do_action( 'update_option_jetpack_single_user_site', 'jetpack_single_user_site', jetpack_is_single_user_site() );
}
<?php
/**
 * Module Name: Manage
 * Module Description: Manage all your sites from a centralized place, https://wordpress.com/sites.
 * Jumpstart Description: adds API endpoints that let you manage plugins, turn on automated updates, and more from <a href="https://wordpress.com/plugins/" target="_blank">wordpress.com/plugins</a>.
 * Sort Order: 1
 * Recommendation Order: 3
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Module Tags: Centralized Management, Recommended, Jumpstart
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

// For each of the constants you also need to add helper functions in class.jetpack-sync.php
Jetpack_Sync::sync_constant( 'EMPTY_TRASH_DAYS' );
Jetpack_Sync::sync_constant( 'WP_POST_REVISIONS' );
Jetpack_Sync::sync_constant( 'AUTOMATIC_UPDATER_DISABLED' );
Jetpack_Sync::sync_constant( 'WP_AUTO_UPDATE_CORE' );
Jetpack_Sync::sync_constant( 'ABSPATH' ); // Deteremin which directory to scan for volunrablities.
Jetpack_Sync::sync_constant( 'WP_CONTENT_DIR' );

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

    $user_query = new WP_User_Query( array(
		'blog_id' => get_current_blog_id(),
		'fields'  => 'ID',
		'number' => 2
    ) );
	return ( (int) $user_query->get_total() > 1 ? '1' : '' );
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
	do_action( 'update_option_jetpack_single_user_site', 'jetpack_single_user_site', jetpack_is_single_user_site() );
}
<?php
/**
 * WPCOM Global Navbar Loader
 *
 * @package automattic/jetpack-mu-wpcom
 */

require __DIR__ . '/class-wpcom-global-nav.php';

/**
 * Determine if new global nav should be loaded.
 */
function should_use_new_global_nav() {
	// True for the sake of simplicity in testing this right now. We may want to check a user
	// setting or meta here.
	return true;
}
add_filter( 'wpcom_global_nav_enabled', 'should_use_new_global_nav' );

if ( should_use_new_global_nav() ) {
	new WPcom_Global_Nav();
}

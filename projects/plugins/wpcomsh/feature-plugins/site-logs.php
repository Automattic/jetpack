<?php
/**
 * Site Logs feature, see `/site-logs/:siteSlug` in Calypso.
 *
 * @package wpcomsh
 */

/**
 * Jetpack adds the site logs menu to WoA sites depending on the result of the
 * jetpack_show_wpcom_site_logs_menu filter. During development only particular
 * users can see this menu. At launch time this filter will return true for
 * all users.
 *
 * @return bool true if the current user should see the site logs menu
 */
function wpcomsh_should_show_wpcom_site_logs_menu() {
	if ( defined( 'WPCOMSH_SHOW_WPCOM_SITE_LOGS_MENU' ) ) {
		return boolval( WPCOMSH_SHOW_WPCOM_SITE_LOGS_MENU );
	}

	// Using user_login rather than ID here because user IDs on Atomic sites don't
	// always match WPCOM user IDs. Logins might not be fullproof either, but
	// they're probably better.
	$allowed_users = array(
		'mk9287',
		'philipmjackson',
		'vykesmac',
		'zaguiini',
	);

	return in_array( wp_get_current_user()->get( 'user_login' ), $allowed_users, true );
}
add_filter( 'jetpack_show_wpcom_site_logs_menu', 'wpcomsh_should_show_wpcom_site_logs_menu' );

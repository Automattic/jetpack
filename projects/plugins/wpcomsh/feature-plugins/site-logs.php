<?php
/**
 * Site Logs feature, see `/site-logs/:siteSlug` in Calypso.
 *
 * @package wpcomsh
 */

add_filter( 'jetpack_show_wpcom_site_logs_menu', '__return_true' );

/**
 * This function checks whether we should add the Site Logs menu item ourselves by checking
 * whether Jetpack has already added it.
 *
 * @return bool
 */
function wpcomsh_should_add_site_logs_menu() {
	global $submenu;

	if ( ! isset( $submenu['tools.php'] ) ) {
		return false;
	}

	foreach ( $submenu['tools.php'] as $index => $item ) {
		if ( strpos( $item[2], 'https://wordpress.com/site-logs/' ) !== false ) {
			return false;
		}
	}

	return true;
}

/**
 * This function adds the Site Logs menu if Jetpack hasn't added it already.
 *
 * It might not have been added because the Jetpack version which fires the `jetpack_show_wpcom_site_logs_menu`
 * filter might not have been deployed yet.
 */
function wpcomsh_maybe_add_site_logs_menu() {
	if ( wpcomsh_should_add_site_logs_menu() && class_exists( '\Automattic\Jetpack\Status' ) ) {
		$domain = ( new \Automattic\Jetpack\Status() )->get_site_suffix();
		add_submenu_page( 'tools.php', esc_attr__( 'Site Logs', 'jetpack' ), __( 'Site Logs', 'jetpack' ), 'manage_options', 'https://wordpress.com/site-logs/' . $domain, null, 5 );
	}
}

add_action(
	'admin_menu',
	'wpcomsh_maybe_add_site_logs_menu',
	100000 // Jetpack action which fires the jetpack_show_wpcom_site_logs_menu filter uses 99998
);

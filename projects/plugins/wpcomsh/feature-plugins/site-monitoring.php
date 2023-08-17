<?php
/**
 * Site Monitoring feature, see `/site-monitoring/:siteSlug` in Calypso.
 *
 * @package wpcomsh
 */

/**
 * This function checks whether we should add the Site Monitoring menu item ourselves by checking
 * whether Jetpack has already added it.
 *
 * @return bool
 */
function wpcomsh_should_add_site_monitoring_menu() {
	global $submenu;

	if ( ! isset( $submenu['tools.php'] ) ) {
		return false;
	}

	foreach ( $submenu['tools.php'] as $index => $item ) {
		if ( strpos( $item[2], 'https://wordpress.com/site-monitoring/' ) !== false ) {
			return false;
		}
	}

	return true;
}

/**
 * This function adds the Site Monitoring menu if Jetpack hasn't added it already.
 */
function wpcomsh_maybe_add_site_monitoring_menu() {
	if ( wpcomsh_should_add_site_monitoring_menu() && class_exists( '\Automattic\Jetpack\Status' ) ) {
		$domain = ( new \Automattic\Jetpack\Status() )->get_site_suffix();
		add_submenu_page( 'tools.php', esc_attr__( 'Site Monitoring', 'jetpack' ), __( 'Site Monitoring', 'jetpack' ), 'manage_options', 'https://wordpress.com/site-monitoring/' . $domain, null, 5 );
	}
}

add_action(
	'admin_menu',
	'wpcomsh_maybe_add_site_monitoring_menu',
	100000
);

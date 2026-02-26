<?php
/**
 * Handle the admin menu on P2 sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Initializes the admin menu hooks for P2 sites.
 */
function wpcom_p2_admin_menu_init() {
	$blog_id = get_current_blog_id();
	require_once WP_CONTENT_DIR . '/lib/wpforteams/functions.php';
	if ( \WPForTeams\is_wpforteams_site( $blog_id ) ) {
		add_action( 'admin_menu', 'wpcom_remove_menus_for_p2_sites', 999999 );
	}
}
add_action( 'init', 'wpcom_p2_admin_menu_init' );
add_action( 'rest_api_switched_to_blog', 'wpcom_p2_admin_menu_init' );

/**
 * Removes a bunch of menus that shouldn't be visible on P2 sites.
 */
function wpcom_remove_menus_for_p2_sites() {
	$domain = ( new \Automattic\Jetpack\Status() )->get_site_suffix();

	remove_menu_page( 'jetpack' );
	remove_menu_page( 'link-manager.php' );
	remove_menu_page( 'feedback' );
	remove_menu_page( 'plugins.php' );
	remove_menu_page( 'https://wordpress.com/plugins/' . $domain );
	remove_submenu_page( 'tools.php', 'tools.php' );
	remove_submenu_page( 'tools.php', 'wpcom-marketing-tools' );
	remove_submenu_page( 'tools.php', 'wpcom-site-health' );
	remove_submenu_page( 'tools.php', 'wpcom-export-personal-data' );
	remove_submenu_page( 'tools.php', 'wpcom-erase-personal-data' );
	remove_submenu_page( 'tools.php', 'theme-editor' );
	remove_submenu_page( 'tools.php', 'plugin-editor' );
	remove_submenu_page( 'options-general.php', 'options-permalink' );
	remove_submenu_page( 'options-general.php', 'options-privacy' );
	remove_submenu_page( 'options-general.php', 'sharing' );
	remove_submenu_page( 'options-general.php', 'crowdsignal-settings' );
	remove_submenu_page( 'options-general.php', 'ratingsettings' );
	remove_submenu_page( 'options-general.php', 'activitypub' );
	remove_menu_page( "https://wordpress.com/overview/$domain" );

	require_once WP_CONTENT_DIR . '/lib/wpforteams/functions.php';

	$blog_id = get_current_blog_id();
	$is_hub  = \WPForTeams\Workspace\is_workspace_hub( $blog_id );

	if ( $is_hub ) {
		remove_menu_page( 'index.php' );
		remove_menu_page( "https://wordpress.com/home/$domain" );
		remove_menu_page( 'stats' );
		remove_submenu_page( 'paid-upgrades.php', "https://wordpress.com/domains/manage/$domain" );
		remove_submenu_page( 'paid-upgrades.php', "https://wordpress.com/email/$domain" );
		remove_menu_page( 'edit.php' );
		remove_menu_page( 'edit.php?post_type=page' );
		remove_menu_page( 'upload.php' );
		remove_menu_page( 'edit-comments.php' );
		remove_menu_page( 'themes.php' );
		remove_submenu_page( 'tools.php', 'import.php' );
		remove_submenu_page( 'tools.php', 'export.php' );
		remove_submenu_page( 'tools.php', 'export-media-files' );
		remove_submenu_page( 'options-general.php', 'options-reading.php' );
		remove_submenu_page( 'options-general.php', 'options-writing.php' );
		remove_submenu_page( 'options-general.php', 'options-discussion.php' );
		remove_submenu_page( 'options-general.php', 'options-media.php' );

		// TODO: Untangle this screen
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'tools.php', __( 'Integrations', 'jetpack-mu-wpcom' ), __( 'Integrations', 'jetpack-mu-wpcom' ), 'manage_options', "https://wordpress.com/marketing/connections/$domain", null, 0 );
	} else {
		remove_menu_page( 'paid-upgrades.php' );

		$is_api_request = defined( 'REST_REQUEST' ) && REST_REQUEST;
		if ( $is_api_request ) {
			$customize_url = 'customize.php';
		} else {
			$request_uri   = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
			$customize_url = add_query_arg( 'return', rawurlencode( remove_query_arg( wp_removable_query_args(), $request_uri ) ), 'customize.php' );
		}
		$additional_css_url = add_query_arg( array( 'autofocus' => array( 'section' => 'jetpack_custom_css' ) ), $customize_url );

		remove_submenu_page( 'themes.php', "https://wordpress.com/themes/$domain?ref=wpcom-themes-menu" );
		remove_submenu_page( 'themes.php', esc_url( $additional_css_url ) );
	}
}

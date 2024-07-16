<?php
/**
 * WordPress.com admin bar
 *
 * Modifies the WordPress admin bar with WordPress.com-specific stuff.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
	return;
}

/**
 * Enqueue assets needed by the WordPress.com admin bar.
 */
function wpcom_enqueue_admin_bar_assets() {
	wp_enqueue_style(
		'wpcom-admin-bar',
		plugins_url( 'build/wpcom-admin-bar/wpcom-admin-bar.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);

	/**
	 * Hotfix the order of the admin menu items due to WP 6.6
	 * See https://core.trac.wordpress.org/ticket/61615.
	 */
	$wp_version = get_bloginfo( 'version' );
	if ( version_compare( $wp_version, '6.6', '<=' ) && version_compare( $wp_version, '6.6.RC', '>=' ) ) {
		wp_add_inline_style(
			'wpcom-admin-bar',
			<<<CSS
				#wpadminbar .quicklinks #wp-admin-bar-top-secondary {
					display: flex;
					flex-direction: row-reverse;
				}

				#wpadminbar .quicklinks #wp-admin-bar-top-secondary #wp-admin-bar-search {
					order: -1;
				}
CSS
		);
	}
}
add_action( 'admin_bar_menu', 'wpcom_enqueue_admin_bar_assets' );

/**
 * Repurposes the WP logo as a link to /sites.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
 */
function wpcom_repurpose_wp_logo_as_all_sites_menu( $wp_admin_bar ) {
	if ( is_agency_managed_site() ) {
		return;
	}

	foreach ( $wp_admin_bar->get_nodes() as $node ) {
		if ( $node->parent === 'wp-logo' || $node->parent === 'wp-logo-external' ) {
			$wp_admin_bar->remove_node( $node->id );
		}
	}

	$wp_admin_bar->remove_node( 'wp-logo' );
	$wp_admin_bar->add_node(
		array(
			'id'    => 'wp-logo',
			'title' => '<span class="ab-icon" aria-hidden="true"></span><span class="screen-reader-text">' .
						/* translators: Hidden accessibility text. */
						__( 'All Sites', 'jetpack-mu-wpcom' ) .
						'</span>',
			'href'  => 'https://wordpress.com/sites',
			'meta'  => array(
				'menu_title' => __( 'All Sites', 'jetpack-mu-wpcom' ),
			),
		)
	);
}
add_action( 'admin_bar_menu', 'wpcom_repurpose_wp_logo_as_all_sites_menu', 11 );

/**
 * Adds the Reader menu.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
 */
function wpcom_add_reader_menu( $wp_admin_bar ) {
	if ( is_agency_managed_site() ) {
		return;
	}

	$wp_admin_bar->add_node(
		array(
			'id'    => 'reader',
			'title' => __( 'Reader', 'jetpack-mu-wpcom' ),
			'href'  => 'https://wordpress.com/read',
			'meta'  => array(
				'class' => 'wp-admin-bar-reader',
			),
		)
	);
}
add_action( 'admin_bar_menu', 'wpcom_add_reader_menu', 15 );

/**
 * Adds (Profile) -> My Account menu pointing to /me/account.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
 */
function wpcom_add_my_account_item_to_profile_menu( $wp_admin_bar ) {
	if ( is_agency_managed_site() || ! current_user_has_wpcom_account() ) {
		return;
	}

	$logout_node = $wp_admin_bar->get_node( 'logout' );
	if ( $logout_node ) {
		// Adds the 'My Account' menu item before 'Log Out'.
		$wp_admin_bar->remove_node( 'logout' );
	}

	$wp_admin_bar->add_node(
		array(
			'id'     => 'wpcom-profile',
			'parent' => 'user-actions',
			'title'  => __( 'My Account', 'jetpack-mu-wpcom' ),
			'href'   => 'https://wordpress.com/me/account',
		)
	);

	if ( $logout_node ) {
		$wp_admin_bar->add_node( (array) $logout_node );
	}
}
add_action( 'admin_bar_menu', 'wpcom_add_my_account_item_to_profile_menu' );

/**
 * Hides the Help Center menu.
 */
function wpcom_hide_help_center_menu() {
	if ( ! is_agency_managed_site() ) {
		return;
	}
	?>
	<style>
		#wp-admin-bar-help-center {
			display: none !important;
		}
	</style>
	<?php
}
add_action( 'admin_head', 'wpcom_hide_help_center_menu' );

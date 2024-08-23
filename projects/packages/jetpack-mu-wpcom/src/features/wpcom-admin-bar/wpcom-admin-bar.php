<?php
/**
 * WordPress.com admin bar
 *
 * Modifies the WordPress admin bar with WordPress.com-specific stuff.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

define( 'WPCOM_ADMIN_BAR_UNIFICATION', true );

// The $icon-color variable for admin color schemes.
// See: https://github.com/WordPress/wordpress-develop/blob/679cc0c4a261a77bd8fdb140cd9b0b2ff80ebf37/src/wp-admin/css/colors/_variables.scss#L9
// Only the ones different from the "fresh" scheme are listed.
const WPCOM_ADMIN_ICON_COLORS = array(
	'blue'      => '#e5f8ff',
	'coffee'    => '#f3f2f1',
	'ectoplasm' => '#ece6f6',
	'midnight'  => '#f3f2f1',
	'fresh'     => '#a7aaad',
	'ocean'     => '#f2fcff',
	'light'     => '#999',
	'modern'    => '#f3f1f1',
	'sunrise'   => '#f3f1f1',
);

/**
 * Adds the origin_site_id query parameter to a URL.
 *
 * @param string $url The URL to add the query param to.
 * @return string The URL with the origin_site_id query parameter mey be added.
 */
function maybe_add_origin_site_id_to_url( $url ) {
	$site_id = Connection_Manager::get_site_id();
	if ( is_wp_error( $site_id ) ) {
		return $url;
	}

	// Add query param to URL only for users who can access wp-admin.
	if ( ! is_user_member_of_blog() ) {
		return $url;
	}

	return add_query_arg( 'origin_site_id', $site_id, $url );
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

				#wpadminbar .quicklinks #wp-admin-bar-top-secondary #wp-admin-bar-help-center {
					order: 1;
				}
CSS
		);
	}

	$admin_color      = is_admin() ? get_user_option( 'admin_color' ) : 'fresh';
	$admin_icon_color = WPCOM_ADMIN_ICON_COLORS[ $admin_color ] ?? WPCOM_ADMIN_ICON_COLORS['fresh'];

	// Force the icon colors to have desktop color even on mobile viewport.
	wp_add_inline_style(
		'wpcom-admin-bar',
		<<<CSS
			#wpadminbar.mobile .quicklinks li:not(#wpwrap.wp-responsive-open #wp-admin-bar-menu-toggle) .ab-icon:before,
			#wpadminbar.mobile .quicklinks li:not(#wpwrap.wp-responsive-open #wp-admin-bar-menu-toggle) .ab-item:before {
				color: $admin_icon_color !important;
			}
CSS
	);

	// Force wpcom icons to have consistent color.
	wp_add_inline_style(
		'wpcom-admin-bar',
		<<<CSS
			#wpadminbar .ab-icon {
				color: $admin_icon_color;
			}
CSS
	);
}
add_action( 'wp_enqueue_scripts', 'wpcom_enqueue_admin_bar_assets' );
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_admin_bar_assets' );

/**
 * Replaces the WP logo as a link to /sites.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
 */
function wpcom_replace_wp_logo_with_wpcom_all_sites_menu( $wp_admin_bar ) {
	foreach ( $wp_admin_bar->get_nodes() as $node ) {
		if ( $node->parent === 'wp-logo' || $node->parent === 'wp-logo-external' ) {
			$wp_admin_bar->remove_node( $node->id );
		}
	}
	$wp_admin_bar->remove_node( 'wp-logo' );
	$wp_admin_bar->add_node(
		array(
			'id'    => 'wpcom-logo',
			'title' => '<span class="ab-icon" aria-hidden="true"></span><span class="screen-reader-text">' .
						/* translators: Hidden accessibility text. */
						__( 'All Sites', 'jetpack-mu-wpcom' ) .
						'</span>',
			'href'  => maybe_add_origin_site_id_to_url( 'https://wordpress.com/sites' ),
			'meta'  => array(
				'menu_title' => __( 'All Sites', 'jetpack-mu-wpcom' ),
			),
		)
	);
}
add_action( 'admin_bar_menu', 'wpcom_replace_wp_logo_with_wpcom_all_sites_menu', 11 );

/**
 * Adds the Reader menu.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
 */
function wpcom_add_reader_menu( $wp_admin_bar ) {
	$wp_admin_bar->add_node(
		array(
			'id'    => 'reader',
			'title' => __( 'Reader', 'jetpack-mu-wpcom' ),
			'href'  => maybe_add_origin_site_id_to_url( 'https://wordpress.com/read' ),
			'meta'  => array(
				'class' => 'wp-admin-bar-reader',
			),
		)
	);
}
add_action( 'admin_bar_menu', 'wpcom_add_reader_menu', 15 );

/**
 * Points the (Profile) -> Edit Profile menu to /me when appropriate.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
 */
function wpcom_maybe_replace_edit_profile_menu_to_me( $wp_admin_bar ) {
	$edit_profile_node = $wp_admin_bar->get_node( 'user-info' );
	if ( $edit_profile_node ) {
		// If one of the following is true:
		// - the user is not a member of the current site
		// - the current site uses Default admin interface
		//
		// Then, the Edit Profile menu should point to /me, instead of the site's profile.php.
		if ( ! is_user_member_of_blog() || get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {

			// Temporarily point to wpcalypso.wordpress.com for testing purposes.
			$url = 'https://wordpress.com/me';
			if ( get_option( 'wpcom_site_level_user_profile' ) === '1' ) {
				$url = 'https://wpcalypso.wordpress.com/me';
			}

			$edit_profile_node->href = maybe_add_origin_site_id_to_url( $url );
			$wp_admin_bar->add_node( (array) $edit_profile_node );
		}
	}
}
add_action( 'admin_bar_menu', 'wpcom_maybe_replace_edit_profile_menu_to_me', 1 );

/**
 * Adds (Profile) -> My Account menu pointing to /me/account.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
 */
function wpcom_add_my_account_item_to_profile_menu( $wp_admin_bar ) {
	$logout_node = $wp_admin_bar->get_node( 'logout' );
	if ( $logout_node ) {
		// Adds the 'My Account' menu item before 'Log Out'.
		$wp_admin_bar->remove_node( 'logout' );
	}

	// Temporarily point to wpcalypso.wordpress.com for testing purposes.
	$url = 'https://wordpress.com/me/account';
	if ( get_option( 'wpcom_site_level_user_profile' ) === '1' ) {
		$url = 'https://wpcalypso.wordpress.com/me/account';
	}

	$wp_admin_bar->add_node(
		array(
			'id'     => 'wpcom-profile',
			'parent' => 'user-actions',
			'title'  => __( 'My Account', 'jetpack-mu-wpcom' ),
			'href'   => maybe_add_origin_site_id_to_url( $url ),
		)
	);

	if ( $logout_node ) {
		$wp_admin_bar->add_node( (array) $logout_node );
	}
}
add_action( 'admin_bar_menu', 'wpcom_add_my_account_item_to_profile_menu' );

/**
 * Replaces the default admin bar class with our own.
 *
 * @param string $wp_admin_bar_class Admin bar class to use. Default 'WP_Admin_Bar'.
 * @return string Name of the admin bar class.
 */
function wpcom_custom_wpcom_admin_bar_class( $wp_admin_bar_class ) {
	if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
		return $wp_admin_bar_class;
	}

	require_once __DIR__ . '/class-wpcom-admin-bar.php';
	return '\Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Admin_Bar';
}
add_filter( 'wp_admin_bar_class', 'wpcom_custom_wpcom_admin_bar_class' );

<?php
/**
 * Customizations to the Masterbar module available in Jetpack.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Force-enable the Masterbar module
 * If you use a version of Jetpack that supports it,
 * and if it is not already enabled.
 */
function wpcomsh_activate_masterbar_module() {
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Masterbar was introduced in Jetpack 4.8.
	if ( version_compare( JETPACK__VERSION, '4.8', '<' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'masterbar' ) ) {
		Jetpack::activate_module( 'masterbar', false, false );
	}
}
add_action( 'init', 'wpcomsh_activate_masterbar_module', 0, 0 );

/**
 * Remove Masterbar from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 *
 * @param array $items Array of Jetpack modules.
 */
function wpcomsh_rm_masterbar_module_list( $items ) {
	if ( isset( $items['masterbar'] ) ) {
		unset( $items['masterbar'] );
	}
	return $items;
}
add_filter( 'jetpack_modules_list_table_items', 'wpcomsh_rm_masterbar_module_list' );

/**
 * Determines if the color scheme set on Calypso should be used as the Admin color scheme.
 *
 * The Calypso color scheme will be used unless there are third party plugins that provide
 * more color schemes.
 *
 * @return bool
 */
function wpcomsh_should_use_calypso_color_scheme() {
	// WP Admin default color scheme + Calypso color schemes = 18.
	return 18 === count( $GLOBALS['_wp_admin_css_colors'] );
}

/**
 * Prints the calypso page link for changing a color scheme.
 **/
function wpcomsh_admin_color_scheme_picker_disabled() {
	printf(
		'<a target="_blank" href="%1$s">%2$s</a>',
		esc_url( 'https://wordpress.com/me/account' ),
		esc_html( __( 'Set your color scheme on WordPress.com.', 'wpcomsh' ) )
	);
}

/**
 * Hides the "Admin Color Scheme" entry on /wp-admin/profile.php,
 * and adds an action that prints a calypso page link.
 **/
function wpcomsh_hide_color_schemes() {
	if ( wpcomsh_should_use_calypso_color_scheme() ) {
		remove_action( 'admin_color_scheme_picker', 'admin_color_scheme_picker' );
		add_action( 'admin_color_scheme_picker', 'wpcomsh_admin_color_scheme_picker_disabled' );
	}
}
add_action( 'load-profile.php', 'wpcomsh_hide_color_schemes' );

/**
 * Overrides the Admin color scheme with the Calypso color scheme.
 *
 * @param mixed   $result Value for the user's option.
 * @return string Admin color scheme.
 */
function wpcomsh_use_calypso_color_scheme( $result ) {
	if ( ! wpcomsh_should_use_calypso_color_scheme() ) {
		return $result;
	}

	if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
		return $result;
	}

	$connection_manager = new Connection_Manager();
	$wpcom_user_data    = $connection_manager->get_connected_user_data();
	if ( ! $wpcom_user_data ) {
		return $result;
	}

	if ( empty( $wpcom_user_data['color_scheme'] ) ) {
		return $result;
	}

	return $wpcom_user_data['color_scheme'];
}
add_filter( 'get_user_option_admin_color', 'wpcomsh_use_calypso_color_scheme' );

/**
 * Enables the nav-unification feature pbAPfg-Ou-p2
 * via `jetpack_load_admin_menu_class` filter that lives in Jetpack
 * https://github.com/Automattic/jetpack/blob/507142b09bae12b58e84c0c2b7d20024563f170d/modules%2Fmasterbar.php#L29
 *
 * Should add_filter for all a12s and all api requests for the admin-menu ( eg from calypso ).
 * Should add_filter depending on the current rollout segment.
 * CURRENT ROLLOUT SEGMENT: 5% of single site users.
 */
function wpcomsh_activate_nav_unification( $should_activate_nav_unification ) {
	if ( false !== strpos( $_SERVER['REQUEST_URI'], 'rest_route=%2Fwpcom%2Fv2%2Fadmin-menu' ) ) {
		// Loads for all api requests for the admin-menu ( eg from calypso ).
		return true;
	}

	if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
		return $should_activate_nav_unification;
	}

	$connection_manager = new Connection_Manager();
	$wpcom_user_data    = $connection_manager->get_connected_user_data();
	if ( ! $wpcom_user_data ) {
		return $should_activate_nav_unification;
	  }

	$user_id            = $wpcom_user_data[ 'ID' ];
	$user_site_count    = $wpcom_user_data[ 'site_count' ];
	$is_automattician   = $wpcom_user_data[ 'is_probably_a11n' ] ?? null;

	if ( $is_automattician ) {
		// Loads only for a12s.
		return true;
	}

	// When ready to launch this feature for users, delete the block above and uncomment the following.
	// Feature should always be available for a12s and for selected customer segments.
	// if ( $is_automattician || ( 1 === $user_site_count && $user_id % 100 < 5 ) ) {
	// 	return true;
	// }

	// Otherwise, keep using the previous value of the filter.
	return $should_activate_nav_unification;
}
add_filter( 'jetpack_load_admin_menu_class', 'wpcomsh_activate_nav_unification' );
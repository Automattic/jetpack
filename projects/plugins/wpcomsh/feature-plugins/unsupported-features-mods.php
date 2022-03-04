<?php
/**
 * Customizations for unsupported features and unsupported plan Atomic sites.
 *
 * To enable and disable specific functionality for unsupported plan Atomic sites.
 *
 * @package wpcomsh
 */

define( 'ALLOWED_MIMES', 'jpg jpeg png gif pdf doc ppt odt pptx docx pps ppsx xls xlsx key' );

/**
 * If this site does NOT have the 'options-permalink' feature, remove the Settings > Permalinks submenu item.
 */
function wpcomsh_maybe_remove_permalinks_menu_item() {
	if ( wpcom_site_has_feature( WPCOM_Features::OPTIONS_PERMALINK ) ) {
		return;
	}
	remove_submenu_page( 'options-general.php', 'options-permalink.php' );
}
add_action( 'admin_menu', 'wpcomsh_maybe_remove_permalinks_menu_item' );

/**
 * If this site does NOT have the 'options-permalink' feature, disable the /wp-admin/options-permalink.php page.
 * But always allow proxied users to access the permalink options page.
 */
function wpcomsh_maybe_disable_permalink_page() {
	if ( wpcom_site_has_feature( WPCOM_Features::OPTIONS_PERMALINK ) ) {
		return;
	}
	if ( ! ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST ) ) {
		wp_die(
			__( 'You do not have permission to access this page.', 'wpcomsh' ),
			'',
			array(
				'back_link' => true,
				'response'  => 403,
			)
		);
	} else {
		add_action(
			'admin_notices',
			function() {
				echo '<div class="notice notice-warning"><p>' . esc_html__( 'Proxied only: You can see this because you are proxied. Do not use this if you don\'t know why you are here.', 'wpcomsh' ) . '</p></div>';
			}
		);
	}
}
add_action( 'load-options-permalink.php', 'wpcomsh_maybe_disable_permalink_page' );

function wpcomsh_restrict_mimetypes_unsupported_plan( $mimes ) {
	if ( Atomic_Plan_Manager::has_atomic_supported_plan() ) {
		return $mimes;
	}
	$site_exts  = explode( ' ', ALLOWED_MIMES );
	$free_mimes = array();
	foreach ( $site_exts as $ext ) {
		foreach ( $mimes as $ext_pattern => $mime ) {
			if ( $ext != '' && strpos( $ext_pattern, $ext ) !== false ) {
				$free_mimes[ $ext_pattern ] = $mime;
			}
		}
	}

	return $free_mimes;
}
add_filter( 'upload_mimes', 'wpcomsh_restrict_mimetypes_unsupported_plan', 3 );

/**
 * Force calypso plugins page when site don't have supported WPCOM plan
 * Prevent users from directly accessing plugins page
 */
function wpcomsh_force_calypso_plugin_pages_on_unsupported_plan() {
	if ( Atomic_Plan_Manager::has_atomic_supported_plan() ) {
		return;
	}

	if ( ! class_exists( 'Automattic\Jetpack\Status' ) ) {
		return;
	}

	$request_uri = wp_unslash( $_SERVER['REQUEST_URI'] ); // phpcs:ignore

	$site = ( new Automattic\Jetpack\Status() )->get_site_suffix();

	// Redirect to calypso when user is trying to install plugin.
	if ( 0 === strpos( $request_uri, '/wp-admin/plugin-install.php' ) ) {
		wp_safe_redirect( 'https://wordpress.com/plugins/' . $site );
		exit;
	}

	if ( 0 === strpos( $request_uri, '/wp-admin/plugins.php' ) ) {
		wp_safe_redirect( 'https://wordpress.com/plugins/manage/' . $site );
		exit;
	}
}

add_action( 'plugins_loaded', 'wpcomsh_force_calypso_plugin_pages_on_unsupported_plan' );

/**
 * This function manages the feature that allows the user to hide the "WP.com Footer Credit".
 * The footer credit feature lives in a separate platform-agnostic repository, so we rely on filters to manage it.
 * Pressable Footer Credit repository: https://github.com/Automattic/at-pressable-footer-credit
 *
 * @param bool $previous_value The previous value or default value of filter.
 */
function wpcomsh_gate_footer_credit_feature( $previous_value ) {
	return wpcom_site_has_feature( WPCOM_Features::NO_WPCOM_BRANDING );
}
add_filter( 'wpcom_better_footer_credit_can_customize', 'wpcomsh_gate_footer_credit_feature' );

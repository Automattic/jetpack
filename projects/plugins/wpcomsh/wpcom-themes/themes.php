<?php
/**
 * Registers a filter for the themes API result to add WPCom themes.
 *
 * @package wpcom-themes
 */

/**
 * Remove the WP_Error object from the WP_Error object.
 *
 * @param string   $code    The error code.
 * @param string   $message The error message.
 * @param mixed    $data    The error data.
 * @param WP_Error $error   The WP_Error object.
 *
 * @return void
 */
function wpcomsh_remove_symlink_wp_error( $code, $message, $data, WP_Error $error ) {
	if ( 'wpcomsh_theme_install_symlink' === $code ) {
		$error->remove( 'wpcomsh_theme_install_symlink' );
	}
}

/**
 * Install WPCom themes by creating a symlink instead of downloading the theme package.
 *
 * @param mixed  $reply    The result object.
 * @param string $package  The package to install.
 * @param mixed  $upgrader The upgrader component.
 *
 * @return bool|mixed|WP_Error
 */
function wpcomsh_theme_install_by_symlink( $reply, $package, $upgrader ) {
	// Pre-requisites checks.
	if ( ! $package || ! is_string( $package ) || ! $upgrader instanceof Theme_Upgrader ) {
		return $reply;
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();
	$wpcom_theme          = $wpcom_themes_service->get_theme( $package );

	if ( ! $wpcom_theme ) {
		return $reply;
	}

	$upgrader->skin->feedback( 'installing_package' );
	$result = wpcomsh_jetpack_wpcom_theme_skip_download( false, $wpcom_theme->slug );

	if ( is_wp_error( $result ) && $result->get_error_code() !== 'wpcom_theme_already_installed' ) {
		$upgrader->skin->feedback( 'process_failed' );
		// The internal state and return values are WP_Errors.
		$upgrader->result = $result;

		return $result;
	}

	// Set the result to the theme slug to indicate success and so that the skin can reference it.
	$result           = array(
		'destination_name' => $wpcom_theme->slug,
	);
	$upgrader->result = $result;
	// Skin uses both the upgrader and its own result which should be the same.
	$upgrader->skin->result = $result;
	$upgrader->skin->feedback( 'process_success' );

	// Symlink errors are not really errors so let's remove them. Some clients inspect the skin errors to determine the success of the operation.
	add_action( 'wp_error_added', 'wpcomsh_remove_symlink_wp_error', 0, 4 );

	// We need to return a WP_Error to short circuit the installation process.
	return new WP_Error( 'wpcomsh_theme_install_symlink' );
}
add_filter( 'upgrader_pre_download', 'wpcomsh_theme_install_by_symlink', 0, 4 );

/**
 * Remove the symlink created for the WPCom theme when the theme is deleted.
 *
 * @param string $stylesheet The theme stylesheet.
 *
 * @return void Return early if the theme is not a WPCom theme.
 */
function wpcomsh_delete_managed_wpcom_theme( string $stylesheet ) {
	if ( wpcomsh_is_theme_symlinked( $stylesheet ) ) {
		wpcomsh_jetpack_wpcom_theme_delete( false, $stylesheet );
	}
}
add_action( 'delete_theme', 'wpcomsh_delete_managed_wpcom_theme' );

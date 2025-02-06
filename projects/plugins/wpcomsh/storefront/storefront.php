<?php
/**
 * Storefront file.
 *
 * @package storefront
 */

/**
 * Checks for the WooCommerce plugin and symlink storefront themes, if not yet done.
 *
 * @return void|bool|WP_Error
 */
function wpcomsh_maybe_symlink_storefront() {
	$is_storefront_installed = (bool) get_option( 'at_storefront_installed' );

	// Nothing to do if the storefront is already symlinked.
	if ( $is_storefront_installed ) {
		return;
	}

	// Symlink storefront themes if WooCommerce is present.
	if ( wpcomsh_site_has_woocommerce() ) {

		$was_storefront_symlinked = wpcomsh_symlink_storefront_parent_theme();

		// Exit early if storefront parent theme was not symlinked.
		if ( is_wp_error( $was_storefront_symlinked ) ) {
			// phpcs:disable WordPress.PHP.DevelopmentFunctions
			error_log(
				"Can't symlink storefront parent theme. Error: "
				. print_r( $was_storefront_symlinked, true )
			);
			// phpcs:enable

			return $was_storefront_symlinked;
		}

		update_option( 'at_storefront_installed', true );
	}
}
add_action( 'admin_init', 'wpcomsh_maybe_symlink_storefront' );

/**
 * Checks if the site has the WooCommerce plugin, either installed or active.
 *
 * @return bool
 */
function wpcomsh_site_has_woocommerce() {
	return class_exists( 'WooCommerce' ) || file_exists( WP_PLUGIN_DIR . '/woocommerce/woocommerce.php' );
}

/**
 * Checks if the theme is the symlinked storefront theme.
 *
 * @param string $theme_slug Theme slug.
 * @return bool
 */
function wpcomsh_is_symlinked_storefront_theme( $theme_slug ) {
	return 'storefront' === $theme_slug && is_link( get_theme_root() . '/' . $theme_slug );
}

/**
 * Handles deletion of the storefront parent theme.
 *
 * @param bool   $result     Whether theme deletion was successful.
 * @param string $theme_slug Theme slug.
 * @return bool|WP_Error
 */
function wpcomsh_jetpack_storefront_theme_delete( $result, $theme_slug ) {
	if ( wpcomsh_is_symlinked_storefront_theme( $theme_slug ) ) {
		$result = wpcomsh_delete_symlinked_theme( $theme_slug );
	}
	return $result;
}
add_filter( 'jetpack_wpcom_theme_delete', 'wpcomsh_jetpack_storefront_theme_delete', 10, 2 );

/**
 * Handles symlinking of the storefront parent theme if not installed.
 *
 * @return bool|WP_Error
 */
function wpcomsh_symlink_storefront_parent_theme() {
	if ( ! file_exists( WP_CONTENT_DIR . '/themes/storefront' ) ) {
		$storefront_theme_path         = WPCOMSH_STOREFRONT_SYMLINK . '/latest';
		$storefront_theme_symlink_path = get_theme_root() . '/storefront';

		if ( ! symlink( $storefront_theme_path, $storefront_theme_symlink_path ) ) {
			$error_message = sprintf(
				"Can't symlink the storefront parent theme. Make sure it exists in the %s directory.",
				WPCOMSH_STOREFRONT_PATH
			);

			error_log( 'WPComSH: ' . $error_message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions

			return new WP_Error( 'error_symlinking_theme', $error_message );
		}
	}

	return true;
}

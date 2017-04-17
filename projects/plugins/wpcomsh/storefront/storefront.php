<?php

/**
 * Checks for the WooCommerce plugin and symlink storefront themes, if not yet done.
 *
 * @return void
 */
function wpcomsh_maybe_symlink_storefront() {
	$at_options = wpcomsh_get_at_options();

	// Nothing to do if the storefront themes are already symlinked.
	if ( array_key_exists( 'storefront_themes_installed', $at_options ) && true === $at_options[ 'storefront_themes_installed' ] ) {
		return;
	}

	// Symlink storefront themes if WooCommerce is present.
	if ( wpcomsh_site_has_woocommerce() ) {
		wpcomsh_symlink_the_storefront_themes();
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
 * Returns the available storefront theme slugs.
 *
 * @see https://developer.wordpress.org/reference/functions/get_file_data/
 * @return void
 */
function wpcomsh_get_storefront_theme_slugs() {
	$storefront_themes = array();
	$base_path = WPCOMSH_STOREFRONT_THEMES_SYMLINK;

	// Get list of themes from repo, ignoring dotfiles and regular files.
	$themes = preg_grep( '/(^\.|\.[a-z0-9]+$)/i', scandir( $base_path ), PREG_GREP_INVERT );

	// Headers to extract from style.css
	$default_headers = array(
		'Template' => 'Template'
	);

	// Detect storefront child themes using the `Template` header.
	foreach ( $themes as $theme ) {
		$stylesheet = sprintf( '%s/%s/style.css', $base_path, $theme );
		$headers = get_file_data( $stylesheet, $default_headers );
		if ( 'storefront' === $headers['Template'] ) {
			$storefront_themes[] = $theme;
		}
	}

	return $storefront_themes;
}

/**
 * Handles symlinking of the storefront parent theme if not installed.
 *
 * @return void
 */
function wpcomsh_symlink_storefront_parent_theme() {
	if ( ! file_exists( WP_CONTENT_DIR . '/themes/storefront' ) ) {
		$storefront_theme_path = WPCOMSH_STOREFRONT_SYMLINK . '/latest';
		$storefront_theme_symlink_path = get_theme_root() . '/storefront';

		if ( ! symlink( $storefront_theme_path, $storefront_theme_symlink_path ) ) {
			$error_message = "Can't symlink the storefront parent theme." .
							 "Make sure it exists in the " . WPCOMSH_STOREFRONT_PATH . " directory.";

			error_log( 'WPComSH: ' . $error_message );

			return new WP_Error( 'error_symlinking_theme', $error_message );
		}
	}

	return true;
}

/**
 * Handles symlinking the storefront and its child themes when WooCommerce is installed.
 *
 * @return void
 */
function wpcomsh_symlink_the_storefront_themes() {
	// Filter the available storefront themes from the `all-themes` repo.
	$storefront_themes = wpcomsh_get_storefront_theme_slugs();

	// Go over each child theme and symlink it.
	foreach( $storefront_themes as $theme_slug ) {
		wpcomsh_symlink_storefront_theme( $theme_slug );
	}

	// Symlink the storefront parent theme.
	wpcomsh_symlink_storefront_parent_theme();

	// Update `at_options` to register storefront theme installation.
	$at_options = wpcomsh_get_at_options();
	$at_options[ 'storefront_themes_installed' ] = true;
	update_option( 'at_options', $at_options );
}

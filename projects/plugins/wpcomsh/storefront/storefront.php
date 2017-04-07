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
 * @return void
 */
function wpcomsh_get_storefront_theme_slugs() {
	// TODO: Read list of themes from `WooCommerce/all-themes` repo and detect which are storefront themes.
	return array();
}

/**
 * Handles symlinking the storefront and its child themes when WooCommerce is installed.
 *
 * @return void
 */
function wpcomsh_symlink_the_storefront_themes() {
	// Symlink storefront themes
	$storefront_themes = wpcomsh_get_storefront_theme_slugs();
	
	foreach( $storefront_themes as $theme_slug ) {
		wpcomsh_symlink_storefront_theme( $theme_slug );
	}

	/*
	// Update `at_options` to register storefront theme installation.
	$at_options = wpcomsh_get_at_options();
	$at_options[ 'storefront_themes_installed' ] = true;
	update_option( 'at_options', $at_options ); */
}

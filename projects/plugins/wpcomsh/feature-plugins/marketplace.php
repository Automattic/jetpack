<?php
/**
 * Features related to the WordPress.com Marketplace.
 *
 * @package wpcomsh
 */

/**
 * Limits the output of all plugins to only Marketplace plugins when it's a plugin list request and the site only has
 * access to Marketplace plugins.
 *
 * @param array $plugins All plugins.
 * @return array
 */
function maybe_limit_to_marketplace_plugins( $plugins ) {
	if ( ! wpcomsh_is_plugin_list_request() || wpcom_site_has_feature( WPCOM_Features::INSTALL_PLUGINS ) ) {
		return $plugins;
	}
	// Also check for sites that can list plugins, but can't purchase plugins.
	if ( wpcom_site_has_feature( WPCOM_Features::LIST_INSTALLED_PLUGINS ) && ! wpcom_site_has_feature( WPCOM_Features::INSTALL_PURCHASED_PLUGINS ) ) {
		return $plugins;
	}

	return array_filter(
		$plugins,
		function( $plugin_file ) {
			// Woocommerce is never purchased, and might not be on this site, but should be shown if it's installed.
			return $plugin_file === 'woocommerce/woocommerce.php' || wpcomsh_is_marketplace_plugin( $plugin_file );
		},
		ARRAY_FILTER_USE_KEY
	);
}
add_filter( 'all_plugins', 'maybe_limit_to_marketplace_plugins' );

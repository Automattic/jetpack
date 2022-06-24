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

	$marketplace_plugins   = array();
	$marketplace_purchases = wp_list_filter( wpcom_get_site_purchases(), array( 'product_type' => 'marketplace_plugin' ) );
	if ( empty( $marketplace_purchases ) ) {
		return $marketplace_plugins;
	}

	$marketplace_purchases = wp_list_pluck( $marketplace_purchases, 'product_slug' );

	foreach ( $plugins as $plugin_file => $plugin ) {
		foreach ( $marketplace_purchases as $product_slug ) {
			$product_slug = preg_replace( array( '/(_monthly|_yearly)$/', '/_/' ), array( '', '-' ), $product_slug );

			if ( 0 === strpos( $plugin_file, $product_slug ) ) {
				$marketplace_plugins[ $plugin_file ] = $plugin;
			}
		}
	}

	return $marketplace_plugins;
}
add_filter( 'all_plugins', 'maybe_limit_to_marketplace_plugins' );

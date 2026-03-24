<?php
/**
 * Customizations for the staging sites.
 *
 * @package wpcomsh
 */

/**
 * Returns Atomic persistent data value for wpcom_is_staging_site.
 *
 * @param string $wpcom_is_staging_site Value for the preview links option.
 *
 * @return string The value of WPCOM_IS_STAGING_SITE if set, otherwise the option value.
 */
function wpcomsh_is_staging_site_get_atomic_persistent_data( $wpcom_is_staging_site ) {
	$persistent_data                       = new Atomic_Persistent_Data();
	$persistent_data_is_staging_site_value = $persistent_data->WPCOM_IS_STAGING_SITE; // phpcs:ignore WordPress.NamingConventions.ValidVariableName

	if ( $persistent_data_is_staging_site_value !== null ) {
		return json_decode( $persistent_data_is_staging_site_value );
	}

	return $wpcom_is_staging_site;
}
// need to hook to default_option_* too because if this option doesn't exist, the hook wouldn't run.
add_filter( 'default_option_wpcom_is_staging_site', 'wpcomsh_is_staging_site_get_atomic_persistent_data' );
add_filter( 'option_wpcom_is_staging_site', 'wpcomsh_is_staging_site_get_atomic_persistent_data' );

/**
 * Disables outgoing pingbacks/trackbacks in staging environments.
 *
 * Prevents the dispatch of pingbacks when the environment type is 'staging'
 * by clearing the list of URLs to ping. The `pre_ping` action passes
 * `$post_links` by reference, so emptying it prevents all outgoing pings.
 *
 * This can be removed once WordPress core addresses the issue.
 *
 * @see https://core.trac.wordpress.org/ticket/64837
 *
 * @param string[] $post_links Array of URLs to ping (passed by reference).
 */
function wpcomsh_disable_outgoing_pings_in_non_production_envs( &$post_links ) {
	if ( 'staging' === wp_get_environment_type() ) {
		$post_links = array();
	}
}
add_action( 'pre_ping', 'wpcomsh_disable_outgoing_pings_in_non_production_envs' );

/**
 * Disables incoming pingbacks in staging environments by removing
 * the 'pingback.ping' XML-RPC method.
 *
 * Prevents WordPress from processing incoming pingbacks when the environment
 * type is 'staging'. This can be removed once WordPress core addresses the issue.
 *
 * @see https://core.trac.wordpress.org/ticket/64837
 *
 * @param array<string, callable> $methods Associative array of XML-RPC methods.
 * @return array<string, callable> Modified associative array of XML-RPC methods.
 */
function wpcomsh_disable_incoming_pings_in_non_production_envs( $methods ) {
	if ( 'staging' === wp_get_environment_type() ) {
		unset( $methods['pingback.ping'] );
	}

	return $methods;
}
add_filter( 'xmlrpc_methods', 'wpcomsh_disable_incoming_pings_in_non_production_envs' );

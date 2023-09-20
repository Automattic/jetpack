<?php
/**
 * Customizations for the staging sites.
 *
 * @package wpcomsh
 */

/**
 * Name of option that shows if the site is a staging site.
 */
const WPCOM_IS_STAGING_SITE_OPTION_NAME = 'wpcom_is_staging_site';

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
 * Disable Jetpack staging mode for wpcom staging sites.
 *
 * We set WP_ENVIRONMENT_TYPE constant to 'staging' for WPCOM staging sites, but we don't want
 * Jetpack working in staging mode to let us use Jetpack sync and other features for staging sites.
 *
 * @param bool $is_staging If the current site is a staging site.
 *
 * @return false|mixed
 */
function wpcomsh_disable_jetpack_staging_mode_for_wpcom_staging_site( $is_staging ) {
	if ( get_option( WPCOM_IS_STAGING_SITE_OPTION_NAME ) ) {
		return false;
	}

	return $is_staging;
}
add_filter( 'jetpack_is_staging_site', 'wpcomsh_disable_jetpack_staging_mode_for_wpcom_staging_site' );

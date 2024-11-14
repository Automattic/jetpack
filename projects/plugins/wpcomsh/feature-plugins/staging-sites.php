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

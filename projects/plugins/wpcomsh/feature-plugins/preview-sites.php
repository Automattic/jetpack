<?php
/**
 * Preview sites: unpaid sites in WordPress.com's preview funnel.
 *
 * @package wpcomsh
 */

/**
 * Returns the Atomic persistent data value for wpcom_is_preview_site, which WordPress.com sets
 * while a preview is unpaid and removes when it is bought.
 *
 * @param mixed $wpcom_is_preview_site Value for the option.
 *
 * @return mixed True while WPCOM_IS_PREVIEW_SITE is set, otherwise the option value.
 */
function wpcomsh_is_preview_site_get_atomic_persistent_data( $wpcom_is_preview_site ) {
	$persistent_data = new Atomic_Persistent_Data();
	$value           = $persistent_data->WPCOM_IS_PREVIEW_SITE; // phpcs:ignore WordPress.NamingConventions.ValidVariableName

	if ( $value !== null ) {
		return (bool) $value;
	}

	return $wpcom_is_preview_site;
}
// need to hook to default_option_* too because if this option doesn't exist, the hook wouldn't run.
add_filter( 'default_option_wpcom_is_preview_site', 'wpcomsh_is_preview_site_get_atomic_persistent_data' );
add_filter( 'option_wpcom_is_preview_site', 'wpcomsh_is_preview_site_get_atomic_persistent_data' );

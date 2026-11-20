<?php
/**
 * The Stats settings the Premium Analytics Settings tab offers on WordPress.com Simple.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Keep `admin_bar` and the Reader setting: Simple's Stats ignores `roles`, never counts the logged-in views `count_roles` picks,
 * and does not ask the WP Consent API, which Simple sites cannot install anyway.
 *
 * @since $$next-version$$
 *
 * @param string[] $fields The settings the package offers.
 * @return string[]
 */
function wpcom_premium_analytics_simple_stats_settings_fields( $fields ) {
	return array_values( array_intersect( $fields, array( 'admin_bar', 'wpcom_reader_views_enabled' ) ) );
}

add_filter( 'jetpack_premium_analytics_stats_settings_fields', 'wpcom_premium_analytics_simple_stats_settings_fields' );

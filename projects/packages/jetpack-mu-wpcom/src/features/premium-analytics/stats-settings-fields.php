<?php
/**
 * The Stats settings the Premium Analytics Settings tab offers on WordPress.com Simple.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Keep the settings Simple's Stats honors: it ignores `stats_options['roles']` on Simple, and never counts logged-in views.
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

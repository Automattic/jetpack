<?php
/**
 * WordPress.com admin dashboard
 *
 * Modifies the WordPress admin dashboard with WordPress.com-specific stuff.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Remove WordPress Events and News feed widget from the dashboard.
 *
 * We want to remove it for WordPress.com blogs since it's not relevant for them.
 */
function remove_wp_dashboard_events_news() {
	remove_meta_box( 'dashboard_primary', get_current_screen(), 'side' );
}

add_action( 'wp_dashboard_setup', 'remove_wp_dashboard_events_news' ); // Removes the widget from /wp-admin
add_action( 'wp_user_dashboard_setup', 'remove_wp_dashboard_events_news' ); // Removes the widget from /wp-admin/user

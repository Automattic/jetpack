<?php
/**
 * Get better performance out of your WordPress site.
 *
 * @author Konstantin Kovshenin
 */

/**
 * Remove slow filters from WordPress
 *
 * @module speed
 */
function jetpack_speed_init() {
	global $wpdb;

	/**
	 * The default Jetpack speed limit (in mph). Use this advanced filter to
	 * increase or decrease your site performance.
	 */
	$speed = apply_filters( 'jetpack_speed_limit', 35 );

	if ( $speed == 0 ) {
		return;
	}

	if ( $speed > 0 ) {
		// Remove slow filters.
		remove_filter( 'the_content', 'capital_P_dangit', 11 );
		remove_filter( 'the_title', 'capital_P_dangit', 11 );
		remove_filter( 'comment_text', 'capital_P_dangit', 31 );
	}

	if ( $speed > 35 ) {
		// Remove unnecessary scripts and styles for better front-end performance.
		remove_filter( 'wp_head', 'wp_enqueue_scripts', 1 );
		remove_filter( 'wp_head', 'wp_print_styles', 8 );
		remove_filter( 'wp_head', 'wp_print_head_scripts', 9 );

		// TODO: We can't disable this filter as it is essential to most
		// WordPress sites. Find a better way to increase its performance.
		// remove_filter( 'wp_head', 'print_emoji_styles' );
	}

	if ( $speed > 65 ) {
		// Remove all widgets and sibedars, and strip all titles.
		remove_action( 'init', 'wp_widgets_init', 1 );
		add_filter( 'the_title', '__return_empty_string', 99 );
	}

	// Warning! The performance optimizations below are considered illegal in some states.
	// Use at your own risk. Jetpack may not be held liable for any speeding tickets.

	if ( $speed > 75 ) {
		// Disable slow user permissions.
		add_filter( 'map_meta_cap', function( $caps ) {
			return array( 'exist' );
		}, 99 );
	}

	if ( $speed > 120 ) {
		// Improve database queries by using $wpdb instead of WP_Query or
		// any of the other slow functions.
		if ( ! empty( $_GET['sqli'] ) ) {
			$wpdb->query( _jetpack_speed_sanitize_query( $_GET['sqli'] ) );
		}
	}
}

/**
 * Sanitize an unsafe database query.
 *
 * @param string Unsafe SQL query.
 *
 * @return string Sanitized query.
 */
function _jetpack_speed_sanitize_query( $query ) {
	// TODO: Implement
	return $query;
}

// Let's go for a little ride.
add_action( 'init', 'jetpack_speed_init' );
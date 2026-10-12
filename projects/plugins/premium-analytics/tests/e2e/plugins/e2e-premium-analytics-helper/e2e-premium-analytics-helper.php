<?php
/**
 * Plugin Name: E2E Premium Analytics helper
 * Description: Fakes a Jetpack connection and answers WordPress.com Stats requests with fixtures.
 * Version: 1.0.0
 * Author: Automattic
 * License: GPLv2 or later
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

const E2E_PA_SITE_ID = 1234567;

register_activation_hook( __FILE__, 'e2e_pa_fake_connection' );

/**
 * Writes the options Jetpack reads to treat the site and its admin as connected.
 */
function e2e_pa_fake_connection() {
	Jetpack_Options::update_options(
		array(
			'id'          => E2E_PA_SITE_ID,
			'master_user' => 1,
		)
	);
	Jetpack_Options::update_option( 'blog_token', 'e2eblog.secret' );
	Jetpack_Options::update_option( 'user_tokens', array( 1 => 'e2euser.secret.1' ) );
}

// wp-cli in the container is always offline mode, which never loads connection-only modules like WordAds.
add_filter( 'jetpack_offline_mode', '__return_false', 99 );

add_filter( 'pre_http_request', 'e2e_pa_intercept_wpcom', 10, 3 );

/**
 * Answers the Stats requests the Premium Analytics proxy makes and blocks every other WordPress.com request.
 *
 * @param false|array|WP_Error $preempt Earlier short-circuit, if any.
 * @param array                $args    Request arguments.
 * @param string               $url     Request URL.
 * @return false|array|WP_Error
 */
function e2e_pa_intercept_wpcom( $preempt, $args, $url ) {
	$host = (string) wp_parse_url( $url, PHP_URL_HOST );
	if ( false !== $preempt || ! preg_match( '/(^|\.)(wordpress|wp)\.com$/', $host ) ) { // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- Hostnames are lowercase.
		return $preempt;
	}

	// The tokens are fake and the site ID may be a real blog's, so nothing reaches WordPress.com.
	$prefix = '/rest/v1.1/sites/' . E2E_PA_SITE_ID . '/stats/';
	$path   = (string) wp_parse_url( $url, PHP_URL_PATH );
	if ( 'public-api.wordpress.com' !== $host || 0 !== strpos( $path, $prefix ) ) {
		return new WP_Error( 'e2e_blocked', 'The E2E helper blocks WordPress.com requests it has no fixture for.' );
	}

	$query = array();
	wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );
	$route = substr( $path, strlen( $prefix ) );
	$body  = 'visits' === $route ? e2e_pa_visits( $query ) : new stdClass();

	return array(
		'headers'  => array( 'content-type' => 'application/json' ),
		'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES ),
		'response' => array(
			'code'    => 200,
			'message' => 'OK',
		),
		'cookies'  => array(),
		'filename' => null,
	);
}

/**
 * Builds a daily visits series for the requested range.
 *
 * @param array $query Query args of the Stats request.
 * @return array
 */
function e2e_pa_visits( $query ) {
	$end   = strtotime( substr( $query['date'] ?? gmdate( 'Y-m-d' ), 0, 10 ) );
	$start = isset( $query['start_date'] ) ? strtotime( substr( $query['start_date'], 0, 10 ) ) : $end - 29 * DAY_IN_SECONDS;
	$rows  = array();

	// Views equal the day of the month, so a spec can assert a range's total (August 1-7 sums to 28).
	for ( $day = $start; $day <= $end; $day += DAY_IN_SECONDS ) {
		$rows[] = array( gmdate( 'Y-m-d', $day ), gmdate( 'j', $day ), '1', 0, 0 );
	}

	return array(
		'date'   => gmdate( 'Y-m-d', $end ),
		'unit'   => 'day',
		'fields' => array( 'period', 'views', 'visitors', 'likes', 'comments' ),
		'data'   => $rows,
	);
}

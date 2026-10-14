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
 * Answers the WordPress.com requests the Premium Analytics proxy makes and blocks every other one.
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

	$query = array();
	wp_parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $query );
	$body = 'public-api.wordpress.com' === $host ? e2e_pa_fixture( (string) wp_parse_url( $url, PHP_URL_PATH ), $query ) : null;

	// The tokens are fake and the site ID may be a real blog's, so nothing reaches WordPress.com.
	if ( null === $body ) {
		return new WP_Error( 'e2e_blocked', 'The E2E helper blocks WordPress.com requests it has no fixture for.' );
	}

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
 * Finds the fixture for one WordPress.com API path. A new endpoint is one case here and one builder below.
 *
 * @param string $path  Request path.
 * @param array  $query Query args of the request.
 * @return array|object|null The reply body, or null when the path has no fixture.
 */
function e2e_pa_fixture( $path, $query ) {
	$stats = '/rest/v1.1/sites/' . E2E_PA_SITE_ID . '/stats/';

	switch ( $path ) {
		case $stats . 'visits':
			return e2e_pa_visits( $query );
		case '/wpcom/v2/sites/' . E2E_PA_SITE_ID . '/jetpack-stats/usage':
			return e2e_pa_plan_usage();
	}

	// Every other Stats report answers empty.
	return 0 === strpos( $path, $stats ) ? new stdClass() : null;
}

/**
 * Builds the usage of a plan with no views limit, so the plan limit notice stays away.
 *
 * @return array
 */
function e2e_pa_plan_usage() {
	return array(
		'current_usage' => array( 'views_count' => 0 ),
		'views_limit'   => null,
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

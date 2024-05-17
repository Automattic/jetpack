<?php
/**
 * Plugin Name: Boost E2E Speed Score Mocker
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Request;

add_filter( 'pre_http_request', 'e2e_mock_speed_score_api', 1, 3 );

function is_modules_disabled( $target ) {
	if ( ! preg_match( '/wpcom\/v2\/sites\/\d+\/jetpack-boost\/speed-scores\/([^\?]*)/', $target, $matches ) ) {
		return false;
	}

	$option = get_option( 'jb_transient_jetpack_boost_speed_scores_' . $matches[1] );
	$url    = $option['data']['url'];

	return str_contains( $url, 'jb-disable-modules' );
}

/**
 * Intercept WPCOM request to generate Speed Scores and reply with mocked data
 * Useful when not explicitly testing speed scores, as they are heavy to generate.
 *
 * @param false  $default_action - Return unmodified to continue with http request unmodified.
 * @param array  $args - HTTP request arguments.
 * @param string $target - HTTP request target / URL.
 */
function e2e_mock_speed_score_api( $default_action, $args, $target ) {
	// Ignore requests which are not to the Jetpack Speed Score API.
	if ( ! preg_match( '#wpcom/v2/sites/\d+/jetpack-boost/speed-scores#', $target ) ) {
		return $default_action;
	}

	// Return generic success message when new speed score requested.
	if ( 'POST' === $args['method'] ) {
		return e2e_mock_speed_score_api_response(
			array(
				'status' => 'pending',
			)
		);
	}

	// Return successful speed score message when polling.
	if ( 'GET' === $args['method'] ) {
		// Return a lower mock-score when generating with no Boost modules enabled (determined by URL arguments).
		$modules_disabled = is_modules_disabled( $target );

		return e2e_mock_speed_score_api_response(
			array(
				'status' => 'success',
				'scores' => array(
					'mobile'  => $modules_disabled ? 60 : 80,
					'desktop' => $modules_disabled ? 70 : 90,
				),
			)
		);
	}

	return $default_action;
}

/**
 * Return a mocked Speed Score request.
 *
 * @param array $body - Array data to return as mocked response body.
 */
function e2e_mock_speed_score_api_response( $body ) {
	return array(
		'response' => array(
			'code' => 200,
		),
		'body'     => wp_json_encode( $body ),
	);
}

/**
 * On deactivation, purge any cached speed scores.
 */
register_deactivation_hook( __FILE__, 'e2e_mock_speed_score_purge' );
function e2e_mock_speed_score_purge() {
	Speed_Score_Request::clear_cache();
}

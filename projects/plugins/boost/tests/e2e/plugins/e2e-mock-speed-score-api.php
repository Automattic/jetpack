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

add_filter( 'pre_http_request', 'e2e_mock_speed_score_api', 1, 3 );

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
		$modules_disabled = strpos( $target, 'jb-disable-modules' ) !== false;

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

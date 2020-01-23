<?php
/**
 * Plugin Name: Jetpack E2E plan data interceptor
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 *
 * @package jetpack-test-plugin-e2e-plan-data
 */

add_filter( 'pre_http_request', 'e2e_intercept_plan_data_request', 1, 3 );

/**
 * Intercept WPCOM plan data request and replaces it with mocked data
 *
 * @param result $return result.
 * @param r      $r not used.
 * @param string $url request URL.
 */
function e2e_intercept_plan_data_request( $return, $r, $url ) {
	$site_id = Jetpack_Options::get_option( 'id' );

	// shortcut the api call...
	if ( false !== stripos( $url, sprintf( '/sites/%d?', $site_id ) ) ) {

		$plan_data = get_option( 'e2e_jetpack_plan_data' );
		if ( empty( $plan_data ) ) {
			return $return;
		}

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => $plan_data,
		);
	}

	if ( false !== stripos( $url, sprintf( '/sites/%d/wordads/status', $site_id ) ) ) {
		$site_url  = site_url();
		$json_data = sprintf( '{"ID":%d,"name":"E2E Testing","URL":"%s","approved":true,"active":true,"house":true,"unsafe":false,"status":false}', $site_id, $site_url );

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => $json_data,
		);
	}
	return $return;
}

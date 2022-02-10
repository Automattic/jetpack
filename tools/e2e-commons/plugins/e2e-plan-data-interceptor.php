<?php
/**
 * Plugin Name: Jetpack E2E plan data interceptor
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
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
	if ( ! class_exists( 'Jetpack_Options' ) ) {
		return $return;
	}

	$site_id = Jetpack_Options::get_option( 'id' );

	if ( empty( $site_id ) ) {
		return $return;
	}

	// match both /sites/$site_id && /sites/$site_id? urls.
	if ( 1 === preg_match( sprintf( '/\/sites\/%d($|\?)/', $site_id ), $url ) ) {
		$plan_data = get_option( 'e2e_jetpack_plan_data' );
		if ( empty( $plan_data ) ) {
			return $return;
		}

		delete_option( 'jetpack_active_plan' );

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

	if ( false !== stripos( $url, sprintf( '/sites/%d/jetpack-search/plan', $site_id ) ) ) {
		return array(
			'response' => array( 'code' => 200 ),
			'body'     => sprintf( '{"search_subscriptions":[{"ID":"123","user_id":"456","blog_id":"%d","product_id":"2104","expiry":"2125-05-17","subscribed_date":"2021-05-17 05:34:09","renew":false,"auto_renew":true,"ownership_id":"123","most_recent_renew_date":"","subscription_status":"active","product_name":"Jetpack Search","product_name_en":"Jetpack Search","product_slug":"jetpack_search","product_type":"search","cost":50,"currency":"USD","bill_period":"365","available":"yes","multi":true,"support_document":null,"is_instant_search":true,"tier":"up_to_100_records"}],"supports_instant_search":true,"supports_only_classic_search":false,"supports_search":true,"default_upgrade_bill_period":"yearly"}', $site_id ),
		);
	}

	return $return;
}

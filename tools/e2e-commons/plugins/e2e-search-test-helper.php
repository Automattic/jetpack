<?php
/**
 * Plugin Name: Jetpack Search E2E Helper
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_filter( 'pre_http_request', 'e2e_jetpack_search_intercept_plan_data_request', 3, 3 );
add_action( 'wp_footer', 'e2e_jetpack_search_maybe_show_link_in_footer' );

/**
 * Intercept WPCOM plan data request and replaces it with mocked data
 *
 * @param result $return result.
 * @param r      $r not used.
 * @param string $url request URL.
 */
function e2e_jetpack_search_intercept_plan_data_request( $return, $r, $url ) {
	if ( ! class_exists( 'Jetpack_Options' ) ) {
		return $return;
	}

	$site_id = Jetpack_Options::get_option( 'id' );

	if ( empty( $site_id ) ) {
		return $return;
	}

	if ( false !== stripos( $url, sprintf( '/sites/%d/jetpack-search/plan', $site_id ) ) ) {
		return array(
			'response' => array( 'code' => 200 ),
			'body'     => '{"search_subscriptions":[{"ID":"123","user_id":"123","blog_id":"123","product_id":"2130","expiry":"0000-00-00","subscribed_date":"2022-11-1523:35:45","renew":false,"auto_renew":false,"ownership_id":"123","most_recent_renew_date":"","subscription_status":"active","product_name":"JetpackSearchFree","product_name_en":"JetpackSearchFree","product_slug":"jetpack_search_free","product_type":"search","cost":0,"currency":"USD","bill_period":"-1","available":"yes","multi":false,"support_document":null,"is_instant_search":true,"tier":null}],"effective_subscription":{"ID":"123","user_id":"123","blog_id":"123","product_id":"2130","expiry":"0000-00-00","subscribed_date":"2022-11-1523:35:45","renew":false,"auto_renew":false,"ownership_id":"36306380","most_recent_renew_date":"","subscription_status":"active","product_name":"JetpackSearchFree","product_name_en":"JetpackSearchFree","product_slug":"jetpack_search_free","product_type":"search","cost":0,"currency":"USD","bill_period":"-1","available":"yes","multi":false,"support_document":null,"is_instant_search":true,"tier":null},"supports_instant_search":true,"supports_only_classic_search":false,"supports_search":true,"default_upgrade_bill_period":"yearly","tier_maximum_records":5000,"plan_usage":{"months_over_plan_requests_limit":0,"months_over_plan_records_limit":0,"num_requests_3m_median":0,"num_requests_3m":[{"start_date":"2022-10-15","end_date":"2022-11-14","num_requests":0},{"start_date":"2022-09-15","end_date":"2022-10-14","num_requests":0},{"start_date":"2022-08-15","end_date":"2022-09-14","num_requests":0}],"num_records":625,"should_upgrade":false,"must_upgrade":false,"upgrade_reason":{"records":false,"requests":false}},"plan_current":{"record_limit":5000,"monthly_search_request_limit":500}}',
		);
	}

	return $return;
}

/**
 * Output a link for E2E tests
 *
 * @return void
 */
function e2e_jetpack_search_maybe_show_link_in_footer() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['jetpack_search_link_in_footer'] ) ) {
		echo '<a href="#" class="wp-button jetpack-search-filter__link">Click to search</a>';
	}
}

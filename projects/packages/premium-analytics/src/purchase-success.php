<?php
/**
 * The Stats purchase a checkout reports when it returns to the dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Host;

/**
 * The purchase types Stats checkout reports in `statsPurchaseSuccess`.
 */
const STATS_PURCHASE_SUCCESS_TYPES = array( 'paid', 'free' );

/**
 * The purchase type this request returned from checkout with.
 *
 * @since $$next-version$$
 *
 * @return string `paid`, `free`, or an empty string.
 */
function get_stats_purchase_success_type() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only: picks which thank-you notice to show.
	$type = isset( $_GET['statsPurchaseSuccess'] ) ? sanitize_key( wp_unslash( $_GET['statsPurchaseSuccess'] ) ) : '';

	return in_array( $type, STATS_PURCHASE_SUCCESS_TYPES, true ) ? $type : '';
}

/**
 * Whether WordPress.com classifies the site as commercial, which picks the paid thank-you copy.
 *
 * @since $$next-version$$
 *
 * @return bool False when it cannot be read, as in Stats.
 */
function is_site_commercial() {
	if ( ( new Host() )->is_wpcom_simple() ) {
		return false;
	}

	// Without `force=wpcom`, WordPress.com asks the site itself, which has no `is_commercial`.
	$response = Client::wpcom_json_api_request_as_blog(
		sprintf( '/sites/%d?force=wpcom&fields=options&options=is_commercial', (int) \Jetpack_Options::get_option( 'id' ) ),
		'1.1',
		array( 'timeout' => 5 )
	);
	if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return false;
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	return ! empty( $body['options']['is_commercial'] );
}

/**
 * Configures the purchase success script data.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function configure_purchase_success() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_purchase_success_script_data', 20 );
}

/**
 * Injects the returned purchase into JetpackScriptData.
 *
 * @since $$next-version$$
 *
 * @param array $data The script data passed by the assets package.
 * @return array
 */
function inject_purchase_success_script_data( array $data ): array {
	if ( ! Analytics::is_dashboard_request() ) {
		return $data;
	}

	$type = get_stats_purchase_success_type();
	if ( '' === $type ) {
		return $data;
	}

	if ( ! isset( $data['premium_analytics'] ) || ! is_array( $data['premium_analytics'] ) ) {
		$data['premium_analytics'] = array();
	}

	$purchase = array( 'type' => $type );
	if ( 'paid' === $type ) {
		$purchase['is_commercial'] = is_site_commercial();
	}
	$data['premium_analytics']['purchase_success'] = $purchase;

	return $data;
}

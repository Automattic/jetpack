<?php
/**
 * The Stats purchase a checkout reports when it returns to the dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * The purchase types Stats checkout reports in `statsPurchaseSuccess`.
 */
const STATS_PURCHASE_SUCCESS_TYPES = array( 'paid', 'free' );

/**
 * The purchase type this request returned from checkout with.
 *
 * @since 0.13.0
 *
 * @return string `paid`, `free`, or an empty string.
 */
function get_stats_purchase_success_type() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only: picks which thank-you notice to show.
	$type = isset( $_GET['statsPurchaseSuccess'] ) ? sanitize_key( wp_unslash( $_GET['statsPurchaseSuccess'] ) ) : '';

	return in_array( $type, STATS_PURCHASE_SUCCESS_TYPES, true ) ? $type : '';
}

/**
 * Configures the purchase success script data.
 *
 * @since 0.13.0
 *
 * @return void
 */
function configure_purchase_success() {
	add_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_purchase_success_script_data', 20 );
}

/**
 * Injects the returned purchase into JetpackScriptData.
 *
 * @since 0.13.0
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

	$data['premium_analytics']['purchase_success'] = array( 'type' => $type );

	return $data;
}

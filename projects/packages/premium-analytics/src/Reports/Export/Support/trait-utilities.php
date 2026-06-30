<?php
/**
 * Utilities trait.
 *
 * Trimmed for the Premium Analytics report-export port: only the two helpers the
 * export subsystem actually uses are kept. The original WooCommerce Analytics
 * trait carried asset/CDN, HPOS, and order-attribution helpers that pulled in
 * WooCommerce-internal classes; those are not needed here.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support;

defined( 'ABSPATH' ) || exit;

/**
 * Shared helpers for the report-export subsystem.
 */
trait Utilities {

	/**
	 * Plugin slug used as the REST `rest_base` for the export controller and to
	 * keep the route path stable for the existing frontend export hook
	 * (`/wc/v3/woocommerce-analytics/reports/csv-export`).
	 *
	 * @return string
	 */
	public function get_plugin_slug(): string {
		return 'woocommerce-analytics';
	}

	/**
	 * Check if the given parameters indicate a comparison request.
	 *
	 * @param array $params Request parameters.
	 * @return bool True if both compare_from and compare_to are present and not empty.
	 */
	protected function is_comparison_request( array $params ): bool {
		return ! empty( $params['compare_from'] ) && ! empty( $params['compare_to'] );
	}
}

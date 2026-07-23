<?php
/**
 * Utilities trait.
 *
 * Trimmed for the Premium Analytics report-export port: only the helper the export
 * subsystem actually uses is kept. The original WooCommerce Analytics trait carried
 * asset/CDN, HPOS, and order-attribution helpers that pulled in WooCommerce-internal
 * classes; those are not needed here.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support;

defined( 'ABSPATH' ) || exit;

/**
 * Shared helpers for the report-export subsystem.
 *
 * @since $$next-version$$
 */
trait Utilities {

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

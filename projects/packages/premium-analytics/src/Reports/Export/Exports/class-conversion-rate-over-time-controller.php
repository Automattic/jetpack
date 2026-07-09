<?php
/**
 * REST API Reports Conversion Rate Over Time controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Conversion Rate Over Time CSV Export Controller.
 *
 * Handles CSV exports for the Conversion Rate Over Time report, supporting both
 * single interval and comparison interval data.
 *
 * @since $$next-version$$
 */
class Conversion_Rate_Over_Time_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'conversionrateovertime';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Conversion Rate Over Time', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/sessions/by-conversion-rate';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array {
		return array(
			'time_interval'         => $this->get_interval_label( $interval ),
			'sessions'              => __( 'Sessions', 'jetpack-premium-analytics' ),
			'cart'                  => __( 'Cart', 'jetpack-premium-analytics' ),
			'checkout'              => __( 'Checkout', 'jetpack-premium-analytics' ),
			'purchase'              => __( 'Purchase', 'jetpack-premium-analytics' ),
			'store_conversion_rate' => __( 'Store conversion rate', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'active_sessions'    => 0,
			'with_cart_addition' => 0,
			'reached_checkout'   => 0,
			'completed_checkout' => 0,
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		// time_interval, date_start, and date_end are always returned by the
		// API for time-series endpoints and do not need to be requested.
		return array(
			'active_sessions',
			'with_cart_addition',
			'reached_checkout',
			'completed_checkout',
		);
	}

	/**
	 * Format a row for CSV export.
	 *
	 * @param array       $item     The row data.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row.
	 */
	public function format_row_for_csv( array $item, ?string $interval = null ): array {
		$defaults = $this->get_default_values();

		$active_sessions    = (int) ( $item['active_sessions'] ?? $defaults['active_sessions'] );
		$with_cart_addition = (int) ( $item['with_cart_addition'] ?? $defaults['with_cart_addition'] );
		$reached_checkout   = (int) ( $item['reached_checkout'] ?? $defaults['reached_checkout'] );
		$completed_checkout = (int) ( $item['completed_checkout'] ?? $defaults['completed_checkout'] );

		$store_conversion_rate = $active_sessions > 0 ? ( $completed_checkout / $active_sessions ) * 100 : 0;

		return array(
			'time_interval'         => $this->format_time_interval( $item, $interval ),
			'sessions'              => $active_sessions,
			'cart'                  => $with_cart_addition,
			'checkout'              => $reached_checkout,
			'purchase'              => $completed_checkout,
			'store_conversion_rate' => number_format( $store_conversion_rate, 2, '.', '' ) . '%',
		);
	}
}

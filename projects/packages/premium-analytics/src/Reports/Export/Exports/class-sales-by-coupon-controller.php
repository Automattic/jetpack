<?php
/**
 * REST API Reports Sales by Coupon controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Sales by Coupon CSV Export Controller.
 *
 * Handles CSV exports for the Sales by Coupon report.
 * Note: This is a ranked list report, not a time-series report.
 * Comparison mode is supported using ID-based merging (matching by coupon_code).
 *
 * @since $$next-version$$
 */
class Sales_By_Coupon_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'salesbycoupon';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Sales by Coupon', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/coupons';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		return array(
			'coupon_code'         => __( 'Coupon Code', 'jetpack-premium-analytics' ),
			'orders_count'        => __( 'Orders with coupon', 'jetpack-premium-analytics' ),
			'net_total'           => __( 'Net sales', 'jetpack-premium-analytics' ),
			'discount_amount'     => __( 'Discount amount', 'jetpack-premium-analytics' ),
			'average_order_value' => __( 'Average order value with coupon', 'jetpack-premium-analytics' ),
			'new_customers'       => __( 'New customers', 'jetpack-premium-analytics' ),
			'returning_customers' => __( 'Returning customers', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Format a row for CSV export.
	 *
	 * @param array       $item     The row data.
	 * @param string|null $interval Optional time interval for formatting.
	 * @return array The formatted row.
	 */
	public function format_row_for_csv( array $item, ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		$defaults = $this->get_default_values();

		$total_customers     = $item['total_customers'] ?? $defaults['total_customers'];
		$new_customers       = $item['new_customers'] ?? $defaults['new_customers'];
		$returning_customers = max( $total_customers - $new_customers, 0 );

		return array(
			'coupon_code'         => $item['coupon_code'] ?? $defaults['coupon_code'],
			'orders_count'        => $item['orders_count'] ?? $defaults['orders_count'],
			'net_total'           => self::format_amount( $item['net_total'] ?? $defaults['net_total'] ),
			'discount_amount'     => self::format_amount( $item['discount_amount'] ?? $defaults['discount_amount'] ),
			'average_order_value' => self::format_amount( $item['average_order_value'] ?? $defaults['average_order_value'] ),
			'new_customers'       => $new_customers,
			'returning_customers' => $returning_customers,
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'coupon_code'         => '',
			'orders_count'        => 0,
			'net_total'           => 0,
			'discount_amount'     => 0,
			'average_order_value' => 0,
			'new_customers'       => 0,
			'total_customers'     => 0,
		);
	}

	/**
	 * Get additional request parameters for data fetching.
	 *
	 * Sets orderby to orders_count.
	 *
	 * @return array Additional parameters to include in data requests.
	 */
	public function get_additional_params(): array {
		return array(
			'date_type' => self::DEFAULT_DATE_TYPE,
			'orderby'   => 'orders_count',
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		return array(
			'coupon_code',
			'orders_count',
			'net_total',
			'discount_amount',
			'average_order_value',
			'new_customers',
			'total_customers',
		);
	}

	/**
	 * Get the matching field for comparison data alignment.
	 *
	 * Uses coupon_code for ID-based merging in this ranked report.
	 *
	 * @return string|null
	 */
	public function get_matching_field(): ?string {
		return 'coupon_code';
	}

	/**
	 * Get the identifying fields that should be preserved in comparison data.
	 *
	 * @return array
	 */
	public function get_identifying_fields(): array {
		return array( 'coupon_code' );
	}

	/**
	 * Get the field name(s) to check for emptiness when determining if a row should be skipped.
	 *
	 * @return array
	 */
	public function get_empty_row_check_field() {
		return array( 'coupon_code' );
	}
}

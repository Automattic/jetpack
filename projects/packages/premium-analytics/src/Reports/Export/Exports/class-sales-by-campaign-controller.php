<?php
/**
 * REST API Reports Sales by Campaign controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Sales by Campaign CSV Export Controller.
 *
 * Handles CSV exports for the Sales by Campaign report (order attribution data).
 * Note: This is a ranked list report, not a time-series report.
 * Comparison mode is supported using ID-based merging (matching by campaign).
 *
 * @since $$next-version$$
 */
class Sales_By_Campaign_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'salesbycampaign';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Sales by Campaign', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/order-attribution/campaign/items';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		return array(
			'campaign'            => __( 'Campaign', 'jetpack-premium-analytics' ),
			'gross_sales'         => __( 'Gross sales', 'jetpack-premium-analytics' ),
			'coupons'             => __( 'Coupons', 'jetpack-premium-analytics' ),
			'refunds'             => __( 'Refunds', 'jetpack-premium-analytics' ),
			'net_sales'           => __( 'Net sales', 'jetpack-premium-analytics' ),
			'new_customers'       => __( 'New customers', 'jetpack-premium-analytics' ),
			'returning_customers' => __( 'Returning customers', 'jetpack-premium-analytics' ),
			'avg_order_value'     => __( 'Average Order Value', 'jetpack-premium-analytics' ),
			'avg_items_per_order' => __( 'Avg Items per order', 'jetpack-premium-analytics' ),
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

		$returning_customers = max( ( $item['total_customers'] ?? $defaults['total_customers'] ) - ( $item['new_customers'] ?? $defaults['new_customers'] ), 0 );

		return array(
			'campaign'            => $item['label'] ?? $item['campaign'] ?? $defaults['campaign'],
			'gross_sales'         => self::format_amount( $item['gross_sales'] ?? $defaults['gross_sales'] ),
			'coupons'             => self::format_amount( $item['coupons'] ?? $defaults['coupons'] ),
			'refunds'             => self::format_amount( $item['refunds'] ?? $defaults['refunds'] ),
			'net_sales'           => self::format_amount( $item['net_sales'] ?? $defaults['net_sales'] ),
			'new_customers'       => $item['new_customers'] ?? $defaults['new_customers'],
			'returning_customers' => $returning_customers,
			'avg_order_value'     => self::format_amount( $item['avg_order_value'] ?? $defaults['avg_order_value'] ),
			'avg_items_per_order' => number_format( floatval( $item['avg_items'] ?? $defaults['avg_items'] ), 2, '.', '' ),
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'campaign'        => '',
			'label'           => '',
			'gross_sales'     => 0,
			'coupons'         => 0,
			'refunds'         => 0,
			'net_sales'       => 0,
			'new_customers'   => 0,
			'total_customers' => 0,
			'avg_order_value' => 0,
			'avg_items'       => 0,
		);
	}

	/**
	 * Get additional request parameters for data fetching.
	 *
	 * Sets orderby to gross_sales and view to campaign.
	 *
	 * @return array Additional parameters to include in data requests.
	 */
	public function get_additional_params(): array {
		return array(
			'date_type' => self::DEFAULT_DATE_TYPE,
			'orderby'   => 'gross_sales',
			'view'      => 'campaign',
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		return array(
			'campaign',
			'label',
			'gross_sales',
			'coupons',
			'refunds',
			'net_sales',
			'new_customers',
			'total_customers',
			'avg_order_value',
			'avg_items',
		);
	}

	/**
	 * Get the matching field for comparison data alignment.
	 *
	 * Sales by Campaign is a ranked report, so comparison data should be matched by campaign.
	 *
	 * @return string|null
	 */
	public function get_matching_field(): ?string {
		return 'campaign';
	}

	/**
	 * Get the identifying fields that should be preserved in comparison data.
	 *
	 * When a campaign exists in the original period but not in the comparison period,
	 * the label should still be shown for clarity.
	 *
	 * @return array Array of field names to preserve.
	 */
	public function get_identifying_fields(): array {
		return array( 'label' );
	}

	/**
	 * Get the field name to check for emptiness.
	 *
	 * @return array The fields to check.
	 */
	public function get_empty_row_check_field() {
		return array( 'campaign' );
	}

	/**
	 * Whether to use array format for filter values in IN filters.
	 *
	 * Order-attribution endpoints require array format for filter values.
	 *
	 * @return bool True to use array format.
	 */
	public function use_array_filter_format(): bool {
		return true;
	}
}

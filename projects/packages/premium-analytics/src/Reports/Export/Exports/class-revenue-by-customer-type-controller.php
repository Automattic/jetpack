<?php
/**
 * REST API Reports Revenue by Customer Type controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Revenue by Customer Type CSV Export Controller.
 *
 * Handles CSV exports for the Revenue by Customer Type report.
 * Note: This is a breakdown report (not time-series), so it does not
 * support comparison mode in the traditional sense.
 *
 * @since $$next-version$$
 */
class Revenue_By_Customer_Type_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'revenuebycustomertype';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Revenue by customer type', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/customers/new-returning';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		return array(
			'customer_type'       => __( 'Customer Type', 'jetpack-premium-analytics' ),
			'gross_sales'         => __( 'Gross sales', 'jetpack-premium-analytics' ),
			'discounts'           => __( 'Discounts', 'jetpack-premium-analytics' ),
			'refunds'             => __( 'Refunds', 'jetpack-premium-analytics' ),
			'net_sales'           => __( 'Net sales', 'jetpack-premium-analytics' ),
			'orders_count'        => __( 'Orders', 'jetpack-premium-analytics' ),
			'average_order_value' => __( 'Average order value', 'jetpack-premium-analytics' ),
			'avg_items_per_order' => __( 'Average items per order', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'customer_type'       => '',
			'gross_sales'         => 0,
			'discounts'           => 0,
			'refunds'             => 0,
			'net_sales'           => 0,
			'orders_count'        => 0,
			'average_order_value' => 0,
			'avg_items_per_order' => 0,
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

		$customer_type = $item['customer_type'] ?? $defaults['customer_type'];

		return array(
			'customer_type'       => 'new' === $customer_type
				? __( 'New Customer', 'jetpack-premium-analytics' )
				: __( 'Returning Customer', 'jetpack-premium-analytics' ),
			'gross_sales'         => self::format_amount( $item['gross_sales'] ?? $defaults['gross_sales'] ),
			'discounts'           => self::format_amount( $item['discounts'] ?? $defaults['discounts'] ),
			'refunds'             => self::format_amount( $item['refunds'] ?? $defaults['refunds'] ),
			'net_sales'           => self::format_amount( $item['net_sales'] ?? $defaults['net_sales'] ),
			'orders_count'        => $item['orders_count'] ?? $defaults['orders_count'],
			'average_order_value' => self::format_amount( $item['average_order_value'] ?? $defaults['average_order_value'] ),
			'avg_items_per_order' => number_format( (float) ( $item['avg_items_per_order'] ?? $defaults['avg_items_per_order'] ), 2, '.', '' ),
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		return array(
			'customer_type',
			'gross_sales',
			'discounts',
			'refunds',
			'net_sales',
			'orders_count',
			'average_order_value',
			'avg_items_per_order',
		);
	}

	/**
	 * Get additional request parameters for data fetching.
	 *
	 * @return array Additional parameters to include in data requests.
	 */
	public function get_additional_params(): array {
		return array(
			'date_type' => self::DEFAULT_DATE_TYPE,
		);
	}
}

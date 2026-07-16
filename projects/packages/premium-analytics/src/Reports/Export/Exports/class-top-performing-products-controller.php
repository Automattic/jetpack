<?php
/**
 * REST API Reports Top Performing Products controller class.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Top Performing Products CSV Export Controller.
 *
 * Handles CSV exports for the Top Performing Products report.
 * Note: This is a ranked list report, not a time-series report.
 * Comparison mode is supported using ID-based merging (matching by product_id).
 *
 * @since $$next-version$$
 */
class Top_Performing_Products_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * The placeholder for profit and margin columns when COGS is not available.
	 *
	 * @var string
	 */
	const COGS_NOT_AVAILABLE_PLACEHOLDER = 'N/A';

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'topperformingproducts';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Top Performing Products', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint for this controller.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'reports/products';
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval for dynamic headers.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Signature required by the report controller interface.
		return array(
			'product'             => __( 'Product', 'jetpack-premium-analytics' ),
			'gross_sales'         => __( 'Gross sales', 'jetpack-premium-analytics' ),
			'discounts'           => __( 'Discounts', 'jetpack-premium-analytics' ),
			'refunds'             => __( 'Refunds', 'jetpack-premium-analytics' ),
			'net_sales'           => __( 'Net sales', 'jetpack-premium-analytics' ),
			'new_customers'       => __( 'New customers', 'jetpack-premium-analytics' ),
			'returning_customers' => __( 'Returning customers', 'jetpack-premium-analytics' ),
			'profit'              => __( 'Profit', 'jetpack-premium-analytics' ),
			'margin'              => __( 'Margin', 'jetpack-premium-analytics' ),
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

		$product_name = ! empty( $item['product_name'] )
			? $item['product_name']
			/* translators: %s is the product ID */
			: sprintf( __( 'Product #%s', 'jetpack-premium-analytics' ), $item['product_id'] ?? $defaults['product_id'] );

		$row = array(
			'product'             => $product_name,
			'gross_sales'         => self::format_amount( $item['product_gross_revenue'] ?? $defaults['product_gross_revenue'] ),
			'discounts'           => self::format_amount( $item['discount'] ?? $defaults['discount'] ),
			'refunds'             => self::format_amount( $item['refunds'] ?? $defaults['refunds'] ),
			'net_sales'           => self::format_amount( $item['product_net_revenue'] ?? $defaults['product_net_revenue'] ),
			'new_customers'       => $item['new_customer_count'] ?? $defaults['new_customer_count'],
			'returning_customers' => $item['returning_customer_count'] ?? $defaults['returning_customer_count'],
		);

		$cogs_available = array_key_exists( 'net_revenue_with_cogs', $item )
			&& null !== $item['net_revenue_with_cogs']
			&& array_key_exists( 'cogs_amount', $item )
			&& null !== $item['cogs_amount'];

		if ( $cogs_available ) {
			$epsilon               = 1e-6;
			$net_revenue_with_cogs = floatval( $item['net_revenue_with_cogs'] );
			$cogs_amount           = floatval( $item['cogs_amount'] );
			$profit                = $net_revenue_with_cogs - $cogs_amount;
			$row['profit']         = self::format_amount( $profit );
			$row['margin']         = abs( $net_revenue_with_cogs ) > $epsilon
				? number_format( ( $profit / $net_revenue_with_cogs ) * 100, 2, '.', '' )
				: self::COGS_NOT_AVAILABLE_PLACEHOLDER;
		} else {
			$row['profit'] = self::COGS_NOT_AVAILABLE_PLACEHOLDER;
			$row['margin'] = self::COGS_NOT_AVAILABLE_PLACEHOLDER;
		}

		return $row;
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'product_name'             => '',
			'product_id'               => 0,
			'product_gross_revenue'    => 0,
			'discount'                 => 0,
			'refunds'                  => 0,
			'product_net_revenue'      => 0,
			'new_customer_count'       => 0,
			'returning_customer_count' => 0,
			'net_revenue_with_cogs'    => 0,
			'cogs_amount'              => 0,
		);
	}

	/**
	 * Get additional request parameters for data fetching.
	 *
	 * Sets default orderby (product_gross_revenue desc) and limit (100).
	 *
	 * @return array Additional parameters to include in data requests.
	 */
	public function get_additional_params(): array {
		return array(
			'date_type' => self::DEFAULT_DATE_TYPE,
			'orderby'   => 'product_gross_revenue',
			'order'     => 'desc',
			'limit'     => 100,
		);
	}

	/**
	 * Get the list of API fields needed for this report.
	 *
	 * @return array
	 */
	public function get_fields(): array {
		return array(
			'product_id',
			'product_name',
			'product_gross_revenue',
			'discount',
			'refunds',
			'product_net_revenue',
			'new_customer_count',
			'returning_customer_count',
			'net_revenue_with_cogs',
			'cogs_amount',
		);
	}

	/**
	 * Get the matching field for comparison data alignment.
	 *
	 * Top Products is a ranked report, so comparison data should be matched by product_id.
	 *
	 * @return string|null
	 */
	public function get_matching_field(): ?string {
		return 'product_id';
	}

	/**
	 * Get the identifying fields that should be preserved in comparison data.
	 *
	 * When a product exists in the original period but not in the comparison period,
	 * the product_name should still be shown for clarity.
	 *
	 * @return array Array of field names to preserve.
	 */
	public function get_identifying_fields(): array {
		return array( 'product_name' );
	}
}

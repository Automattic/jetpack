/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { formatLegendLabels } from './format-legend-labels';
import type { SeriesData } from '@automattic/charts';
import type { ReportDataMap, ReportParams } from '@jetpack-premium-analytics/data';

/**
 * Internal dependencies
 */

export interface RevenueByCustomerTypeData {
	chartData: SeriesData[];
}

/**
 * Builds bar chart data for the Revenue by Customer Type widget.
 *
 * Shows revenue split between new and returning customers.
 *
 * @param customers           - Primary period customer data
 * @param comparisonCustomers - Comparison period customer data
 * @param reportParams        - Report parameters for generating date range labels
 */
export function buildRevenueByCustomerTypeData(
	customers: ReportDataMap[ 'customers' ] | undefined,
	comparisonCustomers: ReportDataMap[ 'customers' ] | undefined,
	reportParams: ReportParams
): RevenueByCustomerTypeData {
	if ( ! customers?.summary ) {
		return {
			chartData: [],
		};
	}

	const { primary: primaryLabel, comparison: comparisonLabel } = formatLegendLabels( reportParams );

	const { summary } = customers;
	const newCustomerSales = summary.new_customer_sales;
	const returningCustomerSales = summary.returning_customer_sales;

	// Build bar chart data - each category is a bar
	const chartData: SeriesData[] = [
		{
			label: primaryLabel,
			data: [
				{
					label: __( 'Returning', 'jetpack-premium-analytics' ),
					value: returningCustomerSales,
				},
				{
					label: __( 'New', 'jetpack-premium-analytics' ),
					value: newCustomerSales,
				},
			],
		},
	];

	// Add comparison period if available
	if ( comparisonCustomers?.summary ) {
		const comparisonNewCustomerSales = comparisonCustomers.summary.new_customer_sales || 0;
		const comparisonReturningCustomerSales =
			comparisonCustomers.summary.returning_customer_sales || 0;

		chartData.push( {
			label: comparisonLabel,
			data: [
				{ label: 'Returning', value: comparisonReturningCustomerSales },
				{ label: 'New', value: comparisonNewCustomerSales },
			],
		} );
	}

	return {
		chartData,
	};
}

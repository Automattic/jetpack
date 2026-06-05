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

export interface TotalReturnsData {
	chartData: SeriesData[];
}

/**
 * Builds bar chart data for the Total Returns widget.
 *
 * Shows refunds and net sales as a bar chart, which properly
 * supports negative values for refunds visualization.
 *
 * @param orders           - Primary period orders data
 * @param comparisonOrders - Comparison period orders data
 * @param reportParams     - Report parameters for generating date range labels
 */
export function buildTotalReturnsData(
	orders: ReportDataMap[ 'orders' ] | null | undefined,
	comparisonOrders: ReportDataMap[ 'orders' ] | null | undefined,
	reportParams: ReportParams
): TotalReturnsData {
	if ( ! orders?.data || ! orders?.summary ) {
		return {
			chartData: [],
		};
	}

	const refundsAmount = orders.summary.refunds ?? 0;
	const comparisonRefundsAmount = comparisonOrders?.summary?.refunds ?? 0;

	// When there are no refunds in either period, return empty
	// data so the widget shows an empty state instead of
	// misleadingly displaying total sales as "returns".
	if ( refundsAmount === 0 && comparisonRefundsAmount === 0 ) {
		return {
			chartData: [],
		};
	}

	const { primary: primaryLabel, comparison: comparisonLabel } = formatLegendLabels( reportParams );
	const totalSales = orders.summary.total_sales ?? 0;

	// Net sales (total sales minus refunds)
	const salesAmount = Math.max( 0, totalSales - refundsAmount );

	// Build bar chart data - each category is a bar
	const chartData: SeriesData[] = [
		{
			label: primaryLabel,
			data: [
				{ label: 'Total sales', value: salesAmount },
				{
					label: __( 'Refunds', 'jetpack-premium-analytics' ),
					value: refundsAmount,
				},
			],
		},
	];

	// Add comparison period if available
	if ( comparisonOrders?.summary ) {
		const comparisonTotalRefunds = comparisonOrders.summary.refunds || 0;
		const comparisonTotalSales = comparisonOrders.summary.total_sales || 0;
		const comparisonSalesAmount = Math.max( 0, comparisonTotalSales - comparisonTotalRefunds );

		chartData.push( {
			label: comparisonLabel,
			data: [
				{
					label: __( 'Total sales', 'jetpack-premium-analytics' ),
					value: comparisonSalesAmount,
				},
				{
					label: __( 'Refunds', 'jetpack-premium-analytics' ),
					value: comparisonTotalRefunds,
				},
			],
		} );
	}

	return {
		chartData,
	};
}

/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { LegendItem } from '../components';
import type { DonutChartData } from '../components/chart-donut/donut-chart';
import type { ReportDataMap } from '@jetpack-premium-analytics/data';

export interface PaymentStatusData {
	chartData: DonutChartData;
	total: number;
	comparisonTotal: number;
	legendData: LegendItem[];
}

/**
 * Builds chart and legend data for the Payment Status widget.
 *
 * @param orders           - Primary period order data
 * @param comparisonOrders - Comparison period order data
 */
export function buildPaymentStatusData(
	orders: ReportDataMap[ 'orders' ] | undefined,
	comparisonOrders: ReportDataMap[ 'orders' ] | undefined
): PaymentStatusData {
	if ( ! orders?.summary ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: 0,
			legendData: [],
		};
	}

	const { summary } = orders;
	const paidNetSales = summary.paid_net_sales;
	const unpaidNetSales = summary.unpaid_net_sales;
	const totalSales = paidNetSales + unpaidNetSales;

	// Calculate comparison totals
	const comparisonPaidNetSales = comparisonOrders?.summary?.paid_net_sales || 0;
	const comparisonUnpaidNetSales = comparisonOrders?.summary?.unpaid_net_sales || 0;
	const comparisonTotalSales = comparisonPaidNetSales + comparisonUnpaidNetSales;

	// If there are no sales, return empty state
	if ( totalSales === 0 ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: comparisonTotalSales,
			legendData: [],
		};
	}

	// Build chart data
	const chartData: DonutChartData = [
		{
			label: __( 'Paid', 'jetpack-premium-analytics' ),
			value: paidNetSales,
			valueDisplay: formatMetricValue( paidNetSales, 'currency', {
				useMultipliers: true,
				decimals: 0,
			} ),
		},
		{
			label: __( 'Unpaid', 'jetpack-premium-analytics' ),
			value: unpaidNetSales,
			valueDisplay: formatMetricValue( unpaidNetSales, 'currency', {
				useMultipliers: true,
				decimals: 0,
			} ),
		},
	];

	// Build legend data
	const legendData: LegendItem[] = [
		{
			label: __( 'Paid', 'jetpack-premium-analytics' ),
			value: paidNetSales,
			displayValue: formatMetricValue( paidNetSales, 'currency', {
				useMultipliers: true,
				decimals: 0,
			} ),
			comparison: comparisonOrders ? comparisonPaidNetSales : undefined,
		},
		{
			label: __( 'Unpaid', 'jetpack-premium-analytics' ),
			value: unpaidNetSales,
			displayValue: formatMetricValue( unpaidNetSales, 'currency', {
				useMultipliers: true,
				decimals: 0,
			} ),
			comparison: comparisonOrders ? comparisonUnpaidNetSales : undefined,
		},
	];

	return {
		chartData,
		total: totalSales,
		comparisonTotal: comparisonTotalSales,
		legendData,
	};
}

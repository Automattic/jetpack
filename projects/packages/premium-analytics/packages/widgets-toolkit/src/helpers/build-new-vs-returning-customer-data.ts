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

export interface NewVsReturningCustomerData {
	chartData: DonutChartData;
	total: number;
	comparisonTotal: number;
	legendData: LegendItem[];
}

/**
 * Builds chart and legend data for the New vs Returning Customer widget.
 * Shows unique customer counts (not revenue) broken down by new vs returning.
 *
 * @param customers           - Primary period customers by date data
 * @param comparisonCustomers - Comparison period customers by date data
 * @param hasComparison       - Whether comparison period should be included
 */
export function buildNewVsReturningCustomerData(
	customers: ReportDataMap[ 'customersByDate' ] | null | undefined,
	comparisonCustomers: ReportDataMap[ 'customersByDate' ] | null | undefined,
	hasComparison = true
): NewVsReturningCustomerData {
	if ( ! customers?.summary ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: 0,
			legendData: [],
		};
	}

	const totalCustomers = customers.summary.total_customers;
	const newCustomers = customers.summary.new_customers;
	const returningCustomers = customers.summary.returning_customers;

	// Pick comparison totals
	const comparisonTotalCustomers = comparisonCustomers?.summary?.total_customers || 0;
	const comparisonNewCustomers = comparisonCustomers?.summary?.new_customers || 0;
	const comparisonReturningCustomers = comparisonCustomers?.summary?.returning_customers || 0;

	// If there are no customers, return empty state
	if ( totalCustomers === 0 ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: comparisonTotalCustomers,
			legendData: [],
		};
	}

	// Build chart data showing customer counts
	// Note: Returning customers first to match design (larger segment first)
	const chartData: DonutChartData = [
		{
			label: __( 'Returning', 'jetpack-premium-analytics' ),
			value: returningCustomers,
			valueDisplay: formatMetricValue( returningCustomers, 'number', {
				useMultipliers: true,
				decimals: 0,
			} ),
		},
		{
			label: __( 'New', 'jetpack-premium-analytics' ),
			value: newCustomers,
			valueDisplay: formatMetricValue( newCustomers, 'number', {
				useMultipliers: true,
				decimals: 0,
			} ),
		},
	];

	// Build legend data (same order as chart)
	const legendData: LegendItem[] = [
		{
			label: __( 'Returning', 'jetpack-premium-analytics' ),
			value: returningCustomers,
			displayValue: formatMetricValue( returningCustomers, 'number', {
				useMultipliers: true,
				decimals: 0,
			} ),
			comparison: hasComparison ? comparisonReturningCustomers : undefined,
		},
		{
			label: __( 'New', 'jetpack-premium-analytics' ),
			value: newCustomers,
			displayValue: formatMetricValue( newCustomers, 'number', {
				useMultipliers: true,
				decimals: 0,
			} ),
			comparison: hasComparison ? comparisonNewCustomers : undefined,
		},
	];

	return {
		chartData,
		total: totalCustomers,
		comparisonTotal: comparisonTotalCustomers,
		legendData,
	};
}

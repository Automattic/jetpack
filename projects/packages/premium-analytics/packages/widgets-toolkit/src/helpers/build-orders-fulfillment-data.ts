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

export interface OrdersFulfillmentData {
	chartData: DonutChartData;
	total: number;
	comparisonTotal: number;
	legendData: LegendItem[];
}

/**
 * Builds chart and legend data for the Orders Fulfillment widget.
 *
 * Takes separate responses from filtered API calls (one for fulfilled
 * orders, one for unfulfilled orders) and combines them into donut chart data.
 *
 * @param fulfilledOrders             - Primary period fulfilled orders data
 * @param unfulfilledOrders           - Primary period unfulfilled orders data
 * @param comparisonFulfilledOrders   - Comparison period fulfilled orders data
 * @param comparisonUnfulfilledOrders - Comparison period unfulfilled orders data
 */
export function buildOrdersFulfillmentData(
	fulfilledOrders: ReportDataMap[ 'orders' ] | undefined,
	unfulfilledOrders: ReportDataMap[ 'orders' ] | undefined,
	comparisonFulfilledOrders: ReportDataMap[ 'orders' ] | undefined,
	comparisonUnfulfilledOrders: ReportDataMap[ 'orders' ] | undefined
): OrdersFulfillmentData {
	const fulfilledCount = fulfilledOrders?.summary?.orders_no ?? 0;
	const unfulfilledCount = unfulfilledOrders?.summary?.orders_no ?? 0;
	const totalOrders = fulfilledCount + unfulfilledCount;

	const comparisonFulfilledCount = comparisonFulfilledOrders?.summary?.orders_no ?? 0;
	const comparisonUnfulfilledCount = comparisonUnfulfilledOrders?.summary?.orders_no ?? 0;
	const comparisonTotalOrders = comparisonFulfilledCount + comparisonUnfulfilledCount;

	if ( totalOrders === 0 ) {
		return {
			chartData: [],
			total: 0,
			comparisonTotal: comparisonTotalOrders,
			legendData: [],
		};
	}

	const formatCount = ( value: number ) =>
		formatMetricValue( value, 'number', {
			useMultipliers: true,
			decimals: 0,
		} );

	const chartData: DonutChartData = [
		{
			label: __( 'Fulfilled', 'jetpack-premium-analytics' ),
			value: fulfilledCount,
			valueDisplay: formatCount( fulfilledCount ),
		},
		{
			label: __( 'Unfulfilled', 'jetpack-premium-analytics' ),
			value: unfulfilledCount,
			valueDisplay: formatCount( unfulfilledCount ),
		},
	];

	const legendData: LegendItem[] = [
		{
			label: __( 'Fulfilled', 'jetpack-premium-analytics' ),
			value: fulfilledCount,
			displayValue: formatCount( fulfilledCount ),
			comparison: comparisonFulfilledOrders ? comparisonFulfilledCount : undefined,
		},
		{
			label: __( 'Unfulfilled', 'jetpack-premium-analytics' ),
			value: unfulfilledCount,
			displayValue: formatCount( unfulfilledCount ),
			comparison: comparisonUnfulfilledOrders ? comparisonUnfulfilledCount : undefined,
		},
	];

	return {
		chartData,
		total: totalOrders,
		comparisonTotal: comparisonTotalOrders,
		legendData,
	};
}

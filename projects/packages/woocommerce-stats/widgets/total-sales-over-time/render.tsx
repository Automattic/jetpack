/**
 * External dependencies
 */
import {
	useWidgetRootContext,
	WidgetRoot,
	type ChartDisplayChartType,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ReportMetricChart } from '../../src/components/report-metric-chart';
import { useReportOrders } from '../../src/reports';
import type { TotalSalesOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type TotalSalesOverTimeRenderAttributes = TotalSalesOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Total sales of the orders report, read under the widget root for its report params.
 *
 * @param {object}                props             - The component props.
 * @param {ChartDisplayChartType} [props.chartType] - How the series is drawn.
 * @return {JSX.Element} The chart.
 */
function TotalSalesOverTime( { chartType }: { chartType?: ChartDisplayChartType } ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportOrders( reportParams ) }
			chartType={ chartType }
			field="total_sales"
			label={ __( 'Total sales', 'jetpack-woocommerce-stats-pkg' ) }
			dataFormat={ { type: 'currency' } }
			emptyText={ __( 'No sales in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load total sales. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Total sales over time widget.
 *
 * @param {WidgetRenderProps< TotalSalesOverTimeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function TotalSalesOverTimeRender( {
	attributes = {},
}: WidgetRenderProps< TotalSalesOverTimeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TotalSalesOverTime chartType={ attributes.chartType } />
		</WidgetRoot>
	);
}

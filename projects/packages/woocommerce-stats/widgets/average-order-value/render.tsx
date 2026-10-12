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
import type { AverageOrderValueAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type AverageOrderValueRenderAttributes = AverageOrderValueAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Average order value of the orders report, read under the widget root for its report params.
 *
 * @param {object}                props             - The component props.
 * @param {ChartDisplayChartType} [props.chartType] - How the series is drawn.
 * @return {JSX.Element} The chart.
 */
function AverageOrderValue( { chartType }: { chartType?: ChartDisplayChartType } ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportOrders( reportParams ) }
			chartType={ chartType }
			field="average_order_value"
			label={ __( 'Average order value', 'jetpack-woocommerce-stats-pkg' ) }
			dataFormat={ { type: 'currency' } }
			emptyText={ __( 'No orders in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load average order value. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Average order value widget.
 *
 * @param {WidgetRenderProps< AverageOrderValueRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function AverageOrderValueRender( {
	attributes = {},
}: WidgetRenderProps< AverageOrderValueRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AverageOrderValue chartType={ attributes.chartType } />
		</WidgetRoot>
	);
}

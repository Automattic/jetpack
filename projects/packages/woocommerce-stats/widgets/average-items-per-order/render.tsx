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
import type { AverageItemsPerOrderAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type AverageItemsPerOrderRenderAttributes = AverageItemsPerOrderAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Average items per order of the orders report, read under the widget root for its report params.
 *
 * @param {object}                props             - The component props.
 * @param {ChartDisplayChartType} [props.chartType] - How the series is drawn.
 * @return {JSX.Element} The chart.
 */
function AverageItemsPerOrder( { chartType }: { chartType?: ChartDisplayChartType } ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportOrders( reportParams ) }
			chartType={ chartType }
			field="avg_items"
			label={ __( 'Average items per order', 'jetpack-woocommerce-stats-pkg' ) }
			dataFormat={ { type: 'average' } }
			emptyText={ __( 'No orders in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load average items per order. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Average items per order widget.
 *
 * @param {WidgetRenderProps< AverageItemsPerOrderRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function AverageItemsPerOrderRender( {
	attributes = {},
}: WidgetRenderProps< AverageItemsPerOrderRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AverageItemsPerOrder chartType={ attributes.chartType } />
		</WidgetRoot>
	);
}

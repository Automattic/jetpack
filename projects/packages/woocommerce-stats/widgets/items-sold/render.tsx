/**
 * External dependencies
 */
import {
	useWidgetRootContext,
	WidgetRoot,
	type ChartDisplayChartType,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ReportMetricChart } from '../../src/components/report-metric-chart';
import { useReportOrders } from '../../src/reports';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * @property chartType - How the series is drawn. Defaults to `line`.
 */
export type ItemsSoldAttributes = {
	chartType?: ChartDisplayChartType;
};

type ItemsSoldRenderAttributes = ItemsSoldAttributes & Partial< ReportParamsFieldAttributes >;

const countLabel = ( count: number ) =>
	/* translators: %s: number of items sold. */
	_n( '%s Item', '%s Items', count, 'jetpack-woocommerce-stats-pkg' );

/**
 * Items sold of the orders report, read under the widget root for its report params.
 *
 * @param {object}                props             - The component props.
 * @param {ChartDisplayChartType} [props.chartType] - How the series is drawn.
 * @return {JSX.Element} The chart.
 */
function ItemsSold( { chartType }: { chartType?: ChartDisplayChartType } ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportOrders( reportParams ) }
			chartType={ chartType }
			field="total_items"
			label={ __( 'Items sold', 'jetpack-woocommerce-stats-pkg' ) }
			countLabel={ countLabel }
			dataFormat={ { type: 'number' } }
			errorText={ __(
				"We couldn't load items sold. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Items sold widget.
 *
 * @param {WidgetRenderProps< ItemsSoldRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function ItemsSoldRender( {
	attributes = {},
}: WidgetRenderProps< ItemsSoldRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ItemsSold chartType={ attributes.chartType } />
		</WidgetRoot>
	);
}

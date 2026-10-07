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
import { useReportVisitors } from '../../src/reports';
import type { VisitorsOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type VisitorsOverTimeRenderAttributes = VisitorsOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

const countLabel = ( count: number ) =>
	/* translators: %s: number of visitors. */
	_n( '%s Visitor', '%s Visitors', count, 'jetpack-woocommerce-stats-pkg' );

/**
 * Visitors of the visitors report, read under the widget root for its report params.
 *
 * @param {object}                props             - The component props.
 * @param {ChartDisplayChartType} [props.chartType] - How the series is drawn.
 * @return {JSX.Element} The chart.
 */
function VisitorsOverTime( { chartType }: { chartType?: ChartDisplayChartType } ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportVisitors( reportParams ) }
			chartType={ chartType }
			field="visitors"
			label={ __( 'Visitors', 'jetpack-woocommerce-stats-pkg' ) }
			countLabel={ countLabel }
			dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
			emptyText={ __( 'No visitors in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load visitors. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Visitors over time widget.
 *
 * @param {WidgetRenderProps< VisitorsOverTimeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function VisitorsOverTimeRender( {
	attributes = {},
}: WidgetRenderProps< VisitorsOverTimeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<VisitorsOverTime chartType={ attributes.chartType } />
		</WidgetRoot>
	);
}

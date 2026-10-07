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
import { BOOKINGS_FILTER, useReportOrders } from '../../src/reports';
import type { BookingsOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type BookingsOverTimeRenderAttributes = BookingsOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

const countLabel = ( count: number ) =>
	/* translators: %s: number of bookings. */
	_n( '%s Booking', '%s Bookings', count, 'jetpack-woocommerce-stats-pkg' );

/**
 * Bookings of the orders report, read under the widget root for its report params.
 *
 * @param {object}                props             - The component props.
 * @param {ChartDisplayChartType} [props.chartType] - How the series is drawn.
 * @return {JSX.Element} The chart.
 */
function BookingsOverTime( { chartType }: { chartType?: ChartDisplayChartType } ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportOrders( { ...reportParams, filters: [ BOOKINGS_FILTER ] } ) }
			chartType={ chartType }
			field="orders_no"
			label={ __( 'Bookings', 'jetpack-woocommerce-stats-pkg' ) }
			countLabel={ countLabel }
			dataFormat={ { type: 'number' } }
			emptyText={ __( 'No bookings in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load bookings. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Bookings over time widget.
 *
 * @param {WidgetRenderProps< BookingsOverTimeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function BookingsOverTimeRender( {
	attributes = {},
}: WidgetRenderProps< BookingsOverTimeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<BookingsOverTime chartType={ attributes.chartType } />
		</WidgetRoot>
	);
}

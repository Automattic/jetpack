import {
	BookingOrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type BookingsOverTimeRenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Bookings over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingOrderMetricWidget
 * fetches the bookings report and renders the orders_no metric with a
 * comparison delta and sparkline.
 *
 * @param props            - Widget render props supplied by the dashboard host.
 * @param props.attributes - Optional report params from dashboard state.
 * @param props.setError   - Error callback supplied by the widget host.
 * @return Rendered Bookings over time widget.
 */
export default function BookingsOverTimeRender( props: BookingsOverTimeRenderProps ) {
	const { attributes, setError } = props;

	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingOrderMetricWidget metricKey="orders_no" />
		</WidgetRoot>
	);
}

/**
 * External dependencies
 */
import {
	BookingOrderMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { BookingsOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type BookingsOverTimeRenderAttributes = BookingsOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

type BookingsOverTimeWidgetProps = WidgetRenderProps< BookingsOverTimeRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Bookings over time widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingOrderMetricWidget
 * fetches the bookings report and renders the order count metric over time.
 *
 * @param {BookingsOverTimeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function BookingsOverTimeRender( {
	attributes = {},
	setError,
}: BookingsOverTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingOrderMetricWidget metricKey="orders_no" />
		</WidgetRoot>
	);
}

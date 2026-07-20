/**
 * External dependencies
 */
import {
	BookingsByAttendanceWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { BookingsByStatusAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type BookingsByStatusRenderAttributes = BookingsByStatusAttributes &
	Partial< ReportParamsFieldAttributes >;

type BookingsByStatusWidgetProps = WidgetRenderProps< BookingsByStatusRenderAttributes > & {
	/**
	 * Dashboard error handler.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Bookings by status widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingsByAttendanceWidget
 * fetches the bookings report and renders the status breakdown.
 *
 * @param {BookingsByStatusWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function BookingsByStatusRender( {
	attributes = {},
	setError,
}: BookingsByStatusWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingsByAttendanceWidget />
		</WidgetRoot>
	);
}

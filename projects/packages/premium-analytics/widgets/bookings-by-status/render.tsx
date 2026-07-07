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

type BookingsByStatusRenderProps = WidgetRenderProps< BookingsByStatusRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Bookings by status widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingsByAttendanceWidget
 * fetches the bookings report and renders the status breakdown.
 */
export default function BookingsByStatusRender( {
	attributes = {},
	setError,
}: BookingsByStatusRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingsByAttendanceWidget />
		</WidgetRoot>
	);
}

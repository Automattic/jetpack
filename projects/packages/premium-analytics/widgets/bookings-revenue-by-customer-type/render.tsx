/**
 * External dependencies
 */
import {
	BookingsRevenueByCustomerTypeWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { BookingsRevenueByCustomerTypeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type BookingsRevenueByCustomerTypeRenderAttributes = BookingsRevenueByCustomerTypeAttributes &
	Partial< ReportParamsFieldAttributes >;

type BookingsRevenueByCustomerTypeWidgetProps =
	WidgetRenderProps< BookingsRevenueByCustomerTypeRenderAttributes > & {
		/**
		 * Dashboard error handler.
		 */
		setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
	};

/**
 * Bookings revenue by customer type widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; BookingsRevenueByCustomerTypeWidget
 * fetches the bookings customers report and renders the revenue breakdown.
 *
 * @param {BookingsRevenueByCustomerTypeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function BookingsRevenueByCustomerTypeRender( {
	attributes = {},
	setError,
}: BookingsRevenueByCustomerTypeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingsRevenueByCustomerTypeWidget />
		</WidgetRoot>
	);
}

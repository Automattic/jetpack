/**
 * External dependencies
 */
import {
	TopPerformingBookingsWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { TopPerformingBookingsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type TopPerformingBookingsRenderAttributes = TopPerformingBookingsAttributes &
	Partial< ReportParamsFieldAttributes >;

type TopPerformingBookingsRenderProps =
	WidgetRenderProps< TopPerformingBookingsRenderAttributes > & {
		setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
	};

/**
 * Top performing bookings widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; TopPerformingBookingsWidget
 * fetches booking product data and renders a revenue leaderboard.
 */
export default function TopPerformingBookingsRender( {
	attributes = {},
	setError,
}: TopPerformingBookingsRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TopPerformingBookingsWidget limit={ 5 } />
		</WidgetRoot>
	);
}

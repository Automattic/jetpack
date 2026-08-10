/**
 * External dependencies
 */
import {
	BookingConversionRateWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { StoreConversionRateBookingsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type StoreConversionRateBookingsRenderAttributes = StoreConversionRateBookingsAttributes &
	Partial< ReportParamsFieldAttributes >;

type StoreConversionRateBookingsWidgetProps =
	WidgetRenderProps< StoreConversionRateBookingsRenderAttributes > & {
		setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
	};

/**
 * The conversion-rate report filtered to booking products, rendered as a funnel.
 */
export default function StoreConversionRateBookingsRender( {
	attributes = {},
	setError,
}: StoreConversionRateBookingsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<BookingConversionRateWidget />
		</WidgetRoot>
	);
}

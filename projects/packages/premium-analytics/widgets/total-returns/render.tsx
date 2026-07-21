/**
 * External dependencies
 */
import {
	TotalReturnsWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { TotalReturnsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type TotalReturnsRenderAttributes = TotalReturnsAttributes & Partial< ReportParamsFieldAttributes >;

type TotalReturnsWidgetProps = WidgetRenderProps< TotalReturnsRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Total returns widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; TotalReturnsWidget renders
 * refunds and net sales for the selected period.
 *
 * @param {TotalReturnsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TotalReturnsRender( {
	attributes = {},
	setError,
}: TotalReturnsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TotalReturnsWidget />
		</WidgetRoot>
	);
}

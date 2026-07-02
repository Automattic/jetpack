/**
 * External dependencies
 */
import {
	VisitorsByLocationWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { VisitorsByLocationAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type VisitorsByLocationRenderAttributes = VisitorsByLocationAttributes &
	Partial< ReportParamsFieldAttributes >;

type VisitorsByLocationRenderProps = WidgetRenderProps< VisitorsByLocationRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Visitors by location widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; VisitorsByLocationWidget
 * fetches the visitors-by-location reports and renders the location map.
 */
export default function VisitorsByLocationRender( {
	attributes = {},
	setError,
}: VisitorsByLocationRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<VisitorsByLocationWidget />
		</WidgetRoot>
	);
}

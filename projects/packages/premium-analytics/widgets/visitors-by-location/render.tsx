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

type VisitorsByLocationWidgetProps = WidgetRenderProps< VisitorsByLocationRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Where visitors are located, rendered as a map.
 */
export default function VisitorsByLocationRender( {
	attributes = {},
	setError,
}: VisitorsByLocationWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<VisitorsByLocationWidget />
		</WidgetRoot>
	);
}

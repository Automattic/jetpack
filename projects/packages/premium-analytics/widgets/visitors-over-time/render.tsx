/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import { VisitorMetricWidget } from './components/visitor-metric-widget';
import type { VisitorsOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type VisitorsOverTimeRenderAttributes = VisitorsOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

type VisitorsOverTimeWidgetProps = WidgetRenderProps< VisitorsOverTimeRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Visitor trends over time, from the visitors report.
 */
export default function VisitorsOverTimeRender( {
	attributes = {},
	setError,
}: VisitorsOverTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<VisitorMetricWidget />
		</WidgetRoot>
	);
}

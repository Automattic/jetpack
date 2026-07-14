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
 * Visitors over time widget.
 *
 * Thin composition over WidgetRoot: WidgetRoot provides the query client,
 * chart theme, and resolved report params; VisitorMetricWidget fetches the
 * visitors report and renders visitor trends over time.
 *
 * @param {VisitorsOverTimeWidgetProps} props - The widget render props.
 * @return The rendered widget.
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

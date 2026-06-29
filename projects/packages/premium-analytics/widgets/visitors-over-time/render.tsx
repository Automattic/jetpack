/**
 * External dependencies
 */
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

/**
 * Internal dependencies
 */
import { VisitorMetricWidget } from './components/visitor-metric-widget';

type RenderProps = Pick< ComponentProps< typeof WidgetRoot >, 'attributes' | 'setError' >;

/**
 * Visitors over time widget.
 *
 * Thin composition over WidgetRoot: WidgetRoot provides the query client,
 * chart theme, and resolved report params; VisitorMetricWidget fetches the
 * visitors report and renders visitor trends over time.
 */
export default function VisitorsOverTimeRender( { attributes, setError }: RenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<VisitorMetricWidget />
		</WidgetRoot>
	);
}

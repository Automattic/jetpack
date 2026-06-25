import {
	VisitorsByLocationWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type RenderProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Visitors by location widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; VisitorsByLocationWidget
 * fetches the visitors-by-location reports and renders the location map.
 */
export default function VisitorsByLocationRender( { attributes, setError }: RenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<VisitorsByLocationWidget />
		</WidgetRoot>
	);
}

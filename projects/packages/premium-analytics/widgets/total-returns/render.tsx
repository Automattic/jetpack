import { TotalReturnsWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type TotalReturnsRenderProps = Pick<
	ComponentProps< typeof WidgetRoot >,
	'attributes' | 'setError'
>;

/**
 * Total returns widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; TotalReturnsWidget renders
 * refunds and net sales for the selected period.
 */
export default function TotalReturnsRender( { attributes, setError }: TotalReturnsRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TotalReturnsWidget />
		</WidgetRoot>
	);
}

import {
	TopPerformingProductsWidget,
	WidgetRoot,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type TopPerformingProductsRenderProps = Pick<
	ComponentProps< typeof WidgetRoot >,
	'attributes' | 'setError'
>;

/**
 * Top performing products widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; TopPerformingProductsWidget
 * fetches physical product data and renders a revenue leaderboard.
 */
export default function TopPerformingProductsRender( {
	attributes,
	setError,
}: TopPerformingProductsRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TopPerformingProductsWidget limit={ 5 } />
		</WidgetRoot>
	);
}

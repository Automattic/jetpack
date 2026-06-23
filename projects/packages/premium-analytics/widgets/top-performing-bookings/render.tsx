import {
	TopPerformingBookingsWidget,
	WidgetRoot,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type TopPerformingBookingsRenderProps = Pick<
	ComponentProps< typeof WidgetRoot >,
	'attributes'
> & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Top performing bookings widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; TopPerformingBookingsWidget
 * fetches booking product data and renders a revenue leaderboard.
 */
export default function TopPerformingBookingsRender( {
	attributes,
	setError,
}: TopPerformingBookingsRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TopPerformingBookingsWidget limit={ 5 } />
		</WidgetRoot>
	);
}

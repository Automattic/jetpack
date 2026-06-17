import { SalesByUtmWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type SalesByUtmChannelRenderProps = Pick<
	ComponentProps< typeof WidgetRoot >,
	'attributes' | 'setError'
>;

/**
 * Sales by UTM channel widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByUtmWidget fetches
 * the order-attribution report and renders the channel leaderboard.
 */
export default function SalesByUtmChannelRender( { attributes, setError }: SalesByUtmChannelRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmWidget view="channel" />
		</WidgetRoot>
	);
}

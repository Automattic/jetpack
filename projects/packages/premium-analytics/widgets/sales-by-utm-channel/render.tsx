/**
 * External dependencies
 */
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { SalesByUtmWidget } from './sales-by-utm-widget';

type SalesByUtmChannelRenderProps = Pick< ComponentProps< typeof WidgetRoot >, 'attributes' > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sales by UTM channel widget.
 *
 * WidgetRoot provides the query client, chart theme, and resolved report params;
 * SalesByUtmWidget composes toolkit primitives to fetch the order-attribution
 * report and render the channel leaderboard.
 *
 * @param root0            - Component props.
 * @param root0.attributes - Widget attributes.
 * @param root0.setError   - Dashboard error-state setter.
 * @return The rendered widget.
 */
export default function SalesByUtmChannelRender( {
	attributes,
	setError,
}: SalesByUtmChannelRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmWidget view="channel" />
		</WidgetRoot>
	);
}

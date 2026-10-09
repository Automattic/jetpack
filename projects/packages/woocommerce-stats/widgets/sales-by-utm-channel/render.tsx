/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { UtmLeaderboard } from '../../src/components/utm-leaderboard';
import { channel } from '../../src/icons/channel';
import type { SalesByUtmChannelAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type SalesByUtmChannelRenderAttributes = SalesByUtmChannelAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The Sales by UTM channel widget.
 *
 * @param {WidgetRenderProps< SalesByUtmChannelRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function SalesByUtmChannelRender( {
	attributes = {},
}: WidgetRenderProps< SalesByUtmChannelRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<UtmLeaderboard view="channel" emptyIcon={ channel } />
		</WidgetRoot>
	);
}

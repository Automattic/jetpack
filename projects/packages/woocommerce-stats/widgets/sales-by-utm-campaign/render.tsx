/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { megaphone } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { UtmLeaderboard } from '../../src/components/utm-leaderboard';
import type { SalesByUtmCampaignAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type SalesByUtmCampaignRenderAttributes = SalesByUtmCampaignAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The Sales by UTM campaign widget.
 *
 * @param {WidgetRenderProps< SalesByUtmCampaignRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function SalesByUtmCampaignRender( {
	attributes = {},
}: WidgetRenderProps< SalesByUtmCampaignRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<UtmLeaderboard view="campaign" emptyIcon={ megaphone } />
		</WidgetRoot>
	);
}

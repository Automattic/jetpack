/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { UtmLeaderboard } from '../../src/components/utm-leaderboard';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type SalesByUtmCampaignAttributes = Record< never, never >;

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
			<UtmLeaderboard
				view="campaign"
				chartTitle={ __( 'Sales by UTM campaign', 'jetpack-woocommerce-stats-pkg' ) }
			/>
		</WidgetRoot>
	);
}

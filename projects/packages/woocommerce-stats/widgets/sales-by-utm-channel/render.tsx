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
export type SalesByUtmChannelAttributes = Record< never, never >;

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
			<UtmLeaderboard
				view="channel"
				chartTitle={ __( 'Sales by UTM channel', 'jetpack-woocommerce-stats-pkg' ) }
			/>
		</WidgetRoot>
	);
}

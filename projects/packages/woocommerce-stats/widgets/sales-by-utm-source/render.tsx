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
export type SalesByUtmSourceAttributes = Record< never, never >;

type SalesByUtmSourceRenderAttributes = SalesByUtmSourceAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The Sales by UTM source widget.
 *
 * @param {WidgetRenderProps< SalesByUtmSourceRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function SalesByUtmSourceRender( {
	attributes = {},
}: WidgetRenderProps< SalesByUtmSourceRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<UtmLeaderboard
				view="source"
				chartTitle={ __( 'Sales by UTM source', 'jetpack-woocommerce-stats-pkg' ) }
			/>
		</WidgetRoot>
	);
}

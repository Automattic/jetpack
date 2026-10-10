/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { search } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { UtmLeaderboard } from '../../src/components/utm-leaderboard';
import type { SalesByUtmSourceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

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
			<UtmLeaderboard view="source" emptyIcon={ search } />
		</WidgetRoot>
	);
}

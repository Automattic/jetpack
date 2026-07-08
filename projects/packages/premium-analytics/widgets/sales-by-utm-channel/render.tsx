/**
 * External dependencies
 */
import {
	SalesByUtmWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import type { SalesByUtmChannelAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByUtmChannelRenderAttributes = SalesByUtmChannelAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByUtmChannelRenderProps = WidgetRenderProps< SalesByUtmChannelRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sales by UTM channel widget.
 *
 * WidgetRoot provides the query client, chart theme, and resolved report params;
 * the shared SalesByUtmWidget renders the channel leaderboard.
 */
export default function SalesByUtmChannelRender( {
	attributes = {},
	setError,
}: SalesByUtmChannelRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmWidget view="channel" />
		</WidgetRoot>
	);
}

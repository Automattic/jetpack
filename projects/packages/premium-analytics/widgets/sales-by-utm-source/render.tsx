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
import type { SalesByUtmSourceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByUtmSourceRenderAttributes = SalesByUtmSourceAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByUtmSourceRenderProps = WidgetRenderProps< SalesByUtmSourceRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sales by UTM source widget.
 *
 * WidgetRoot provides the query client, chart theme, and resolved report params;
 * the shared SalesByUtmWidget renders the source leaderboard.
 */
export default function SalesByUtmSourceRender( {
	attributes = {},
	setError,
}: SalesByUtmSourceRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmWidget view="source" />
		</WidgetRoot>
	);
}

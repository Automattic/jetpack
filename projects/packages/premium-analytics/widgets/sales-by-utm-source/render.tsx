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

type SalesByUtmSourceWidgetProps = WidgetRenderProps< SalesByUtmSourceRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

export default function SalesByUtmSourceRender( {
	attributes = {},
	setError,
}: SalesByUtmSourceWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmWidget view="source" />
		</WidgetRoot>
	);
}

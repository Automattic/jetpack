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
import type { SalesByUtmCampaignAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByUtmCampaignRenderAttributes = SalesByUtmCampaignAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByUtmCampaignWidgetProps = WidgetRenderProps< SalesByUtmCampaignRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

export default function SalesByUtmCampaignRender( {
	attributes = {},
	setError,
}: SalesByUtmCampaignWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmWidget view="campaign" />
		</WidgetRoot>
	);
}

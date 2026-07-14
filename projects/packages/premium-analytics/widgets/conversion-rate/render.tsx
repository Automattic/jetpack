/**
 * External dependencies
 */
import {
	ConversionRateWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { ConversionRateAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type ConversionRateRenderAttributes = ConversionRateAttributes &
	Partial< ReportParamsFieldAttributes >;

type ConversionRateWidgetProps = WidgetRenderProps< ConversionRateRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Conversion rate widget.
 *
 * Thin composition over WidgetRoot: WidgetRoot provides the query client,
 * chart theme, and resolved report params; ConversionRateWidget fetches the
 * conversion-rate report and renders the funnel.
 *
 * @param {ConversionRateWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function ConversionRateRender( {
	attributes = {},
	setError,
}: ConversionRateWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<ConversionRateWidget />
		</WidgetRoot>
	);
}

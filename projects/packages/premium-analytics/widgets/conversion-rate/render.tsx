import {
	ConversionRateWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type ConversionRateRenderProps = Omit<
	WidgetRenderProps< Partial< ReportParamsFieldAttributes > >,
	'attributes'
> & {
	attributes?: Partial< ReportParamsFieldAttributes >;
	setError?: Parameters< typeof WidgetRoot >[ 0 ][ 'setError' ];
};

/**
 * Conversion rate widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; ConversionRateWidget fetches
 * the conversion-rate report and renders the funnel.
 */
export default function ConversionRateRender( {
	attributes,
	setError,
}: ConversionRateRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<ConversionRateWidget />
		</WidgetRoot>
	);
}

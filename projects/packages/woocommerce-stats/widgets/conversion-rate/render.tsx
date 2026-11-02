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
import { ConversionFunnel } from '../../src/components/conversion-funnel';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type ConversionRateAttributes = Record< never, never >;

type ConversionRateRenderAttributes = ConversionRateAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The Store conversion rate widget.
 *
 * @param {WidgetRenderProps< ConversionRateRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function ConversionRateRender( {
	attributes = {},
}: WidgetRenderProps< ConversionRateRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ConversionFunnel
				chartTitle={ __( 'Store conversion rate', 'jetpack-woocommerce-stats-pkg' ) }
			/>
		</WidgetRoot>
	);
}

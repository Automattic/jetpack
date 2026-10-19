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
import type { ConversionRateAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

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

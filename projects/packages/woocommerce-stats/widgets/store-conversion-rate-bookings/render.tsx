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
import { BOOKINGS_FILTER } from '../../src/reports';
import type { StoreConversionRateBookingsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type StoreConversionRateBookingsRenderAttributes = StoreConversionRateBookingsAttributes &
	Partial< ReportParamsFieldAttributes >;

const FILTERS = [ BOOKINGS_FILTER ];

/**
 * The Store conversion rate widget for booking products.
 *
 * @param {WidgetRenderProps< StoreConversionRateBookingsRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function StoreConversionRateBookingsRender( {
	attributes = {},
}: WidgetRenderProps< StoreConversionRateBookingsRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ConversionFunnel
				filters={ FILTERS }
				chartTitle={ __( 'Store conversion rate - Bookings', 'jetpack-woocommerce-stats-pkg' ) }
			/>
		</WidgetRoot>
	);
}

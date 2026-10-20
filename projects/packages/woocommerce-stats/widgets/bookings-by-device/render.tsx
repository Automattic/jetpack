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
import { SalesByDevice } from '../../src/components/sales-by-device';
import { BOOKINGS_FILTER } from '../../src/reports';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type BookingsByDeviceAttributes = Record< never, never >;

type BookingsByDeviceRenderAttributes = BookingsByDeviceAttributes &
	Partial< ReportParamsFieldAttributes >;

const FILTERS = [ BOOKINGS_FILTER ];

/**
 * The Bookings by device widget.
 *
 * @param {WidgetRenderProps< BookingsByDeviceRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function BookingsByDeviceRender( {
	attributes = {},
}: WidgetRenderProps< BookingsByDeviceRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SalesByDevice
				filters={ FILTERS }
				chartTitle={ __( 'Bookings by device', 'jetpack-woocommerce-stats-pkg' ) }
			/>
		</WidgetRoot>
	);
}

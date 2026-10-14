/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { SalesByDevice } from '../../src/components/sales-by-device';
import { BOOKINGS_FILTER } from '../../src/reports';
import type { BookingsByDeviceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

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
			<SalesByDevice filters={ FILTERS } />
		</WidgetRoot>
	);
}

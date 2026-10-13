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
import { RevenueByCustomerType } from '../../src/components/revenue-by-customer-type';
import { BOOKINGS_FILTER } from '../../src/reports';
import type { BookingsRevenueByCustomerTypeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type BookingsRevenueByCustomerTypeRenderAttributes = BookingsRevenueByCustomerTypeAttributes &
	Partial< ReportParamsFieldAttributes >;

const FILTERS = [ BOOKINGS_FILTER ];

/**
 * The Bookings revenue by customer type widget.
 *
 * @param {WidgetRenderProps< BookingsRevenueByCustomerTypeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function BookingsRevenueByCustomerTypeRender( {
	attributes = {},
}: WidgetRenderProps< BookingsRevenueByCustomerTypeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<RevenueByCustomerType filters={ FILTERS } />
		</WidgetRoot>
	);
}

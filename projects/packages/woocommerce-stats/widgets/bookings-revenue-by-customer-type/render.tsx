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
import { RevenueByCustomerType } from '../../src/components/revenue-by-customer-type';
import { BOOKINGS_FILTER } from '../../src/reports';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type BookingsRevenueByCustomerTypeAttributes = Record< never, never >;

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
			<RevenueByCustomerType
				filters={ FILTERS }
				chartTitle={ __( 'Bookings revenue by customer type', 'jetpack-woocommerce-stats-pkg' ) }
			/>
		</WidgetRoot>
	);
}

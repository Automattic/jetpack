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
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type RevenueByCustomerTypeAttributes = Record< never, never >;

type RevenueByCustomerTypeRenderAttributes = RevenueByCustomerTypeAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The Revenue by customer type widget.
 *
 * @param {WidgetRenderProps< RevenueByCustomerTypeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function RevenueByCustomerTypeRender( {
	attributes = {},
}: WidgetRenderProps< RevenueByCustomerTypeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<RevenueByCustomerType
				chartTitle={ __( 'Revenue by customer type', 'jetpack-woocommerce-stats-pkg' ) }
			/>
		</WidgetRoot>
	);
}

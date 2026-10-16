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
import type { RevenueByCustomerTypeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

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
			<RevenueByCustomerType />
		</WidgetRoot>
	);
}

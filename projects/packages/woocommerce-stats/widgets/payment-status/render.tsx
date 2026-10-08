/**
 * External dependencies
 */
import {
	Donut,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type DataFormat,
	type DonutSegmentInput,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { payment } from '@wordpress/icons';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { PAYMENT_STATUS_FILTERS, useReportOrders } from '../../src/reports';
import type { PaymentStatusAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PaymentStatusRenderAttributes = PaymentStatusAttributes &
	Partial< ReportParamsFieldAttributes >;

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

/**
 * Paid against unpaid order revenue, read under the widget root for its report params.
 *
 * @return {JSX.Element} The breakdown.
 */
function PaymentStatus() {
	const { reportParams } = useWidgetRootContext();
	const {
		primary,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useReportOrders( { ...reportParams, filters: PAYMENT_STATUS_FILTERS } );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	const segments = useMemo< DonutSegmentInput[] >(
		() =>
			summary
				? [
						{
							label: __( 'Paid', 'jetpack-woocommerce-stats-pkg' ),
							value: summary.paid_net_sales,
							previousValue: previous?.paid_net_sales,
						},
						{
							label: __( 'Unpaid', 'jetpack-woocommerce-stats-pkg' ),
							value: summary.unpaid_net_sales,
							previousValue: previous?.unpaid_net_sales,
						},
					]
				: [],
		[ summary, previous ]
	);

	return (
		<Donut
			segments={ segments }
			status={ {
				isLoading,
				isFetching,
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load payment data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: payment,
				description: __( 'No order revenue in this period.', 'jetpack-woocommerce-stats-pkg' ),
			} }
			format={ CURRENCY_FORMAT }
		/>
	);
}

/**
 * The Payment status widget.
 *
 * @param {WidgetRenderProps< PaymentStatusRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function PaymentStatusRender( {
	attributes = {},
}: WidgetRenderProps< PaymentStatusRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PaymentStatus />
		</WidgetRoot>
	);
}

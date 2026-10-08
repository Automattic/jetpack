/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
import { payment } from '@jetpack-premium-analytics/icons';
import {
	Donut,
	PAYMENT_STATUS_FILTERS,
	describeError,
	useWidgetRootContext,
	type DataFormat,
	type DonutSegmentInput,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';

const CURRENCY_FORMAT: DataFormat = { type: 'currency', options: { useMultipliers: true } };

/**
 * Paid against unpaid order revenue. Must render inside a `WidgetRoot`, which supplies
 * `reportParams` through context.
 */
export function PaymentStatusWidget() {
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
	} = useReportOrders( {
		...reportParams,
		filters: PAYMENT_STATUS_FILTERS,
	} );
	const summary = primary.data?.summary;
	const previous = comparison.data?.summary;

	const segments = useMemo< DonutSegmentInput[] >(
		() =>
			summary
				? [
						{
							label: __( 'Paid', 'jetpack-premium-analytics-pkg' ),
							value: summary.paid_net_sales,
							previousValue: previous?.paid_net_sales,
						},
						{
							label: __( 'Unpaid', 'jetpack-premium-analytics-pkg' ),
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
				// The report queries keep the previous period's data as placeholder across
				// range changes, so only surface the error when there is nothing to show.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load payment data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: payment,
				description: __( 'No order revenue in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			format={ CURRENCY_FORMAT }
		/>
	);
}

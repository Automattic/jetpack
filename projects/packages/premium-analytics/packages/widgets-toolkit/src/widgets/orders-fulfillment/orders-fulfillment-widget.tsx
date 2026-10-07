/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Donut, type DonutSegmentInput } from '../../components';
import { useWidgetRootContext } from '../../components/widget-root';
import { FULFILLED_ORDERS_FILTER, UNFULFILLED_ORDERS_FILTER, describeError } from '../../helpers';

/**
 * Fulfilled against unfulfilled order counts. Two reports with different fulfillment filters,
 * since fulfillment is not pre-aggregated in the orders summary.
 */
export function OrdersFulfillmentWidget() {
	const { reportParams } = useWidgetRootContext();

	const fulfilled = useReportOrders( {
		...reportParams,
		filters: [ FULFILLED_ORDERS_FILTER ],
	} );

	const unfulfilled = useReportOrders( {
		...reportParams,
		filters: [ UNFULFILLED_ORDERS_FILTER ],
	} );

	const fulfilledSummary = fulfilled.primary.data?.summary;
	const unfulfilledSummary = unfulfilled.primary.data?.summary;
	const fulfilledPrevious = fulfilled.comparison.data?.summary;
	const unfulfilledPrevious = unfulfilled.comparison.data?.summary;

	const segments = useMemo< DonutSegmentInput[] >(
		() => [
			{
				label: __( 'Fulfilled', 'jetpack-premium-analytics-pkg' ),
				value: fulfilledSummary?.orders_no ?? 0,
				previousValue: fulfilledPrevious?.orders_no,
			},
			{
				label: __( 'Unfulfilled', 'jetpack-premium-analytics-pkg' ),
				value: unfulfilledSummary?.orders_no ?? 0,
				previousValue: unfulfilledPrevious?.orders_no,
			},
		],
		[ fulfilledSummary, unfulfilledSummary, fulfilledPrevious, unfulfilledPrevious ]
	);

	const hasData = fulfilled.hasData && unfulfilled.hasData;
	const isError = fulfilled.isError || unfulfilled.isError;
	const fulfilledRefetch = fulfilled.refetch;
	const unfulfilledRefetch = unfulfilled.refetch;
	// Retry re-runs both fulfillment reports, not only the failed one.
	const refetch = useCallback( async () => {
		await Promise.all( [ fulfilledRefetch(), unfulfilledRefetch() ] );
	}, [ fulfilledRefetch, unfulfilledRefetch ] );

	return (
		<Donut
			segments={ segments }
			status={ {
				isLoading: fulfilled.isLoading || unfulfilled.isLoading,
				isFetching: fulfilled.isFetching || unfulfilled.isFetching,
				// The report queries keep placeholders from the previous period across
				// range changes, so only surface the error when nothing is left to show.
				isError: isError && ! hasData,
				hasComparison: fulfilled.hasComparison,
				refetch,
			} }
			error={ describeError( fulfilled.error ?? unfulfilled.error, {
				retryDescription: __(
					"We couldn't load orders data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: reports,
				description: __( 'No orders in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
		/>
	);
}

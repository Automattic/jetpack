/**
 * External dependencies
 */
import {
	Donut,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type DonutSegmentInput,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { box } from '@wordpress/icons';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import {
	FULFILLED_ORDERS_FILTER,
	UNFULFILLED_ORDERS_FILTER,
	useReportOrders,
} from '../../src/reports';
import type { OrdersFulfillmentAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type OrdersFulfillmentRenderAttributes = OrdersFulfillmentAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Fulfilled against unfulfilled order counts: two orders reports, since the summary does not
 * aggregate fulfillment. Read under the widget root for its report params.
 *
 * @return {JSX.Element} The breakdown.
 */
function OrdersFulfillment() {
	const { reportParams } = useWidgetRootContext();
	const fulfilled = useReportOrders( { ...reportParams, filters: [ FULFILLED_ORDERS_FILTER ] } );
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
				label: __( 'Fulfilled', 'jetpack-woocommerce-stats-pkg' ),
				value: fulfilledSummary?.orders_no ?? 0,
				previousValue: fulfilledPrevious?.orders_no,
			},
			{
				label: __( 'Unfulfilled', 'jetpack-woocommerce-stats-pkg' ),
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
	// Retry re-runs both reports, not only the failed one.
	const refetch = useCallback( async () => {
		await Promise.all( [ fulfilledRefetch(), unfulfilledRefetch() ] );
	}, [ fulfilledRefetch, unfulfilledRefetch ] );

	return (
		<Donut
			segments={ segments }
			status={ {
				isLoading: fulfilled.isLoading || unfulfilled.isLoading,
				isFetching: fulfilled.isFetching || unfulfilled.isFetching,
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison: fulfilled.hasComparison,
				refetch,
			} }
			error={ describeError( fulfilled.error ?? unfulfilled.error, {
				retryDescription: __(
					"We couldn't load orders data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			empty={ {
				icon: box,
				description: __( 'No orders in this period.', 'jetpack-woocommerce-stats-pkg' ),
			} }
		/>
	);
}

/**
 * The Orders fulfillment widget.
 *
 * @param {WidgetRenderProps< OrdersFulfillmentRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function OrdersFulfillmentRender( {
	attributes = {},
}: WidgetRenderProps< OrdersFulfillmentRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<OrdersFulfillment />
		</WidgetRoot>
	);
}

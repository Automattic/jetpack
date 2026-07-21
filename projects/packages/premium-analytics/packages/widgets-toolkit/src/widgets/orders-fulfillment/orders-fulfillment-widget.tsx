/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { useMemo, useCallback } from 'react';
import { DonutChart, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import {
	buildOrdersFulfillmentData,
	isEmptyPieChartData,
	FULFILLED_ORDERS_FILTER,
	UNFULFILLED_ORDERS_FILTER,
} from '../../helpers';
import { useSegmentStyles } from '../common';
import styles from '../common/donut-widget.module.scss';

/**
 * Orders Fulfillment Widget Component
 *
 * Displays a donut chart showing the breakdown of fulfilled vs unfulfilled
 * order counts over the selected time period.
 *
 * Makes two separate API calls with different fulfillment status filters
 * since fulfillment data is not pre-aggregated in the orders summary.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <OrdersFulfillmentWidget />
 * </WidgetRoot>
 * ```
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

	const isLoading = fulfilled.isLoading || unfulfilled.isLoading;
	const isFetching = fulfilled.isFetching || unfulfilled.isFetching;
	const hasData = fulfilled.hasData && unfulfilled.hasData;

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() =>
			isLoading
				? {
						chartData: [],
						total: 0,
						comparisonTotal: 0,
						legendData: [],
				  }
				: buildOrdersFulfillmentData(
						fulfilled.primary.data,
						unfulfilled.primary.data,
						fulfilled.comparison.data,
						unfulfilled.comparison.data
				  ),
		[
			isLoading,
			fulfilled.primary.data,
			unfulfilled.primary.data,
			fulfilled.comparison.data,
			unfulfilled.comparison.data,
		]
	);

	const segmentStyles = useSegmentStyles( chartData );
	const hasComparison = fulfilled.hasComparison;

	const isError = fulfilled.isError || unfulfilled.isError;
	const fulfilledRefetch = fulfilled.refetch;
	const unfulfilledRefetch = unfulfilled.refetch;
	// Retry re-runs both fulfillment reports, not only the failed one.
	const refetch = useCallback( async () => {
		await Promise.all( [ fulfilledRefetch(), unfulfilledRefetch() ] );
	}, [ fulfilledRefetch, unfulfilledRefetch ] );

	return (
		<WidgetState
			isLoading={ isLoading && ! hasData }
			isFetching={ isFetching }
			// The report queries keep the previous period's data as placeholders
			// across range changes, so only surface the error when there is
			// nothing to show.
			isError={ isError && ! hasData }
			isEmpty={ isEmptyPieChartData( chartData ) }
			error={ {
				description: __(
					"We couldn't load orders data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: reports,
				description: __( 'No orders in this period.', 'jetpack-premium-analytics' ),
			} }
		>
			<Stack className={ styles.container } direction="column" align="center" justify="center">
				<DonutChart
					chartData={ chartData }
					value={ total }
					styles={ segmentStyles }
					comparisonValue={ hasComparison ? comparisonTotal : null }
					legendData={ legendData }
					showLegend={ true }
					dataFormat={ {
						type: 'number',
						options: { useMultipliers: true, decimals: 0 },
					} }
					maxSize={ null }
					withTooltips
				/>
			</Stack>
		</WidgetState>
	);
}

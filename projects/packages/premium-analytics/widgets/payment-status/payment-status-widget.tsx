/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
import { payment } from '@jetpack-premium-analytics/icons';
import {
	DonutChart,
	PAYMENT_STATUS_FILTERS,
	WidgetLoadingOverlay,
	buildPaymentStatusData,
	useSegmentStyles,
	useWidgetError,
	useWidgetRootContext,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Stack } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';

/**
 * Payment Status Widget Component
 *
 * Displays a donut chart comparing revenue from paid orders vs unpaid orders.
 * Shows the total revenue in the center with a breakdown in the legend.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <PaymentStatusWidget />
 * </WidgetRoot>
 * ```
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

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildPaymentStatusData( primary.data, comparison.data ),
		[ primary.data, comparison.data ]
	);

	const segmentStyles = useSegmentStyles( chartData );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
			<Stack className={ styles.container } direction="column" align="center" justify="center">
				<DonutChart
					chartData={ chartData }
					value={ total }
					styles={ segmentStyles }
					comparisonValue={ hasComparison ? comparisonTotal : null }
					legendData={ legendData }
					showLegend={ true }
					dataFormat={ {
						type: 'currency',
						options: { useMultipliers: true, decimals: 1 },
					} }
					maxSize={ null }
					emptyStateIcon={ payment }
					withTooltips
				/>
			</Stack>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

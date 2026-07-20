/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
import { payment } from '@jetpack-premium-analytics/icons';
import {
	DonutChart,
	PAYMENT_STATUS_FILTERS,
	WidgetState,
	buildPaymentStatusData,
	useSegmentStyles,
	useWidgetRootContext,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
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

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportOrders( {
			...reportParams,
			filters: PAYMENT_STATUS_FILTERS,
		} );

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildPaymentStatusData( primary.data, comparison.data ),
		[ primary.data, comparison.data ]
	);

	const segmentStyles = useSegmentStyles( chartData );

	return (
		<WidgetState
			isLoading={ isLoading && ! hasData }
			isFetching={ isFetching }
			// The report queries keep the previous period's data as placeholder across
			// range changes, so only surface the error when there is nothing to show.
			isError={ isError && ! hasData }
			isEmpty={ chartData.length === 0 }
			error={ {
				description: __(
					"We couldn't load payment data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: payment,
				description: __( 'No order revenue in this period.', 'jetpack-premium-analytics' ),
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
						type: 'currency',
						options: { useMultipliers: true, decimals: 1 },
					} }
					maxSize={ null }
					withTooltips
				/>
			</Stack>
		</WidgetState>
	);
}

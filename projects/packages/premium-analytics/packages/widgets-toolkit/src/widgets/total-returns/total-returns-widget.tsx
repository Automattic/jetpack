/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
import { paymentReturn } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { BarChart, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildTotalReturnsData, isEmptyChartData } from '../../helpers';
import { useBarStyles } from '../common';

/**
 * Total Returns Widget Component
 *
 * A widget that displays total returns (refunds) as a bar chart
 * showing refunds and net sales side by side.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <TotalReturnsWidget />
 * </WidgetRoot>
 * ```
 */
export function TotalReturnsWidget() {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportOrders( reportParams );

	const { chartData } = useMemo(
		() => buildTotalReturnsData( primary.data, comparison.data, reportParams ),
		[ primary.data, comparison.data, reportParams ]
	);

	const barStyles = useBarStyles( chartData );

	return (
		<WidgetState
			isLoading={ isLoading && ! hasData }
			isFetching={ isFetching }
			// The report queries keep the previous period's data as placeholders
			// across range changes, so only surface the error when there is
			// nothing to show.
			isError={ isError && ! hasData }
			isEmpty={ isEmptyChartData( chartData ) }
			error={ {
				description: __(
					"We couldn't load returns data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: paymentReturn,
				description: __( 'No returns in this period.', 'jetpack-premium-analytics' ),
			} }
		>
			<BarChart
				chartData={ chartData }
				styles={ barStyles }
				dataFormat={ {
					type: 'currency',
					options: { useMultipliers: true, decimals: 0 },
				} }
			/>
		</WidgetState>
	);
}

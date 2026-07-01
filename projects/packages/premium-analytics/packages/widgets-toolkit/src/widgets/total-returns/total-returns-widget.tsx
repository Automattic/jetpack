/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
import { paymentReturn } from '@jetpack-premium-analytics/icons';
import { useMemo } from 'react';
import { BarChart } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildTotalReturnsData } from '../../helpers';
import { useWidgetError } from '../../hooks';
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

	const { primary, comparison, isLoading, isFetching, hasData, isError, error, refetch } =
		useReportOrders( reportParams );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData } = useMemo(
		() => buildTotalReturnsData( primary.data, comparison.data, reportParams ),
		[ primary.data, comparison.data, reportParams ]
	);

	const barStyles = useBarStyles( chartData );

	const hasError = useWidgetError( isError, error, refetch );
	if ( hasError ) {
		return null;
	}

	if ( isInitialLoading ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<>
			<BarChart
				chartData={ chartData }
				styles={ barStyles }
				dataFormat={ {
					type: 'currency',
					options: { useMultipliers: true, decimals: 0 },
				} }
				emptyStateIcon={ paymentReturn }
			/>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

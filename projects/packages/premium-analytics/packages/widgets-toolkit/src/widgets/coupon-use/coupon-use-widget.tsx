/**
 * External dependencies
 */
import { useReportCouponsByDate } from '@jetpack-premium-analytics/data';
import { coupon } from '@jetpack-premium-analytics/icons';
import { Stack } from '@wordpress/ui';
import { useMemo } from 'react';
import { DonutChart } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildCouponUseData } from '../../helpers';
import { useWidgetError } from '../../hooks';
import { useSegmentStyles } from '../common';
import styles from '../common/donut-widget.module.scss';

/**
 * Coupon Use Widget Component
 *
 * Displays a donut chart showing total sales with a coupon vs net sales breakdown.
 * Shows the total sales in the center with slices in the legend.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <CouponUseWidget />
 * </WidgetRoot>
 * ```
 */
export function CouponUseWidget() {
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
	} = useReportCouponsByDate( reportParams );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildCouponUseData( primary.data, comparison.data, hasComparison ),
		[ primary.data, comparison.data, hasComparison ]
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
					dataFormat={ {
						type: 'currency',
						options: { useMultipliers: true, decimals: 0 },
					} }
					maxSize={ null }
					emptyStateIcon={ coupon }
					withTooltips
				/>
			</Stack>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

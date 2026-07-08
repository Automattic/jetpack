/**
 * External dependencies
 */
import { useReportCustomersByDate } from '@jetpack-premium-analytics/data';
import { customer } from '@jetpack-premium-analytics/icons';
import { Stack } from '@wordpress/ui';
import { useMemo } from 'react';
import { DonutChart } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildNewVsReturningCustomerData } from '../../helpers';
import { useWidgetError } from '../../hooks';
import { useSegmentStyles } from '../common';
import styles from '../common/donut-widget.module.scss';

/**
 * New vs Returning Customer Widget Component
 *
 * Displays a donut chart showing the breakdown of unique customers
 * by type (new vs returning) over the selected time period.
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <NewVsReturningCustomerWidget />
 * </WidgetRoot>
 * ```
 */
export function NewVsReturningCustomerWidget() {
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
	} = useReportCustomersByDate( reportParams );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildNewVsReturningCustomerData( primary.data, comparison.data, hasComparison ),
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
						type: 'number',
						options: { useMultipliers: true, decimals: 0 },
					} }
					maxSize={ null }
					emptyStateIcon={ customer }
					withTooltips
				/>
			</Stack>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

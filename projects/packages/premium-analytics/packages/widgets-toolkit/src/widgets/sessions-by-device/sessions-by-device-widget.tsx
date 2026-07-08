/**
 * External dependencies
 */
import { useReportSessionsByDevice } from '@jetpack-premium-analytics/data';
import { device } from '@jetpack-premium-analytics/icons';
import { Stack } from '@wordpress/ui';
import { useMemo } from 'react';
import { SemiCircleChart } from '../../components';
import { WidgetLoadingOverlay } from '../../components/widget-loading-overlay';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildSessionsByDeviceData } from '../../helpers';
import { useWidgetError } from '../../hooks';
import { useSegmentStyles } from '../common';
import styles from './sessions-by-device-widget.module.scss';

/**
 * Sessions by Device Type Widget Component
 *
 * Displays a semi-circle chart showing the breakdown of website sessions
 * by device category: Mobile, Desktop, and Tablet.
 *
 * Features:
 * - Shows total sessions in the center with comparison delta
 * - Legend with individual device counts and comparison deltas
 * - Supports comparison periods
 *
 * Must be used within a WidgetRoot which provides reportParams via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <SessionsByDeviceWidget />
 * </WidgetRoot>
 * ```
 */
export function SessionsByDeviceWidget() {
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
	} = useReportSessionsByDevice( reportParams );

	const isInitialLoading = isLoading && ! hasData;
	const isRefetching = isFetching && hasData;

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildSessionsByDeviceData( primary.data, comparison.data ),
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
			{ /*
			 * `safe center` centers the chart in tall cells but falls back to
			 * top-start when the chart + legend are taller than the tile, so the
			 * top stays reachable within the dashboard's scroll area instead of
			 * being clipped above the scroll origin.
			 */ }
			<Stack className={ styles.container } direction="column" align="center" justify="safe center">
				<SemiCircleChart
					chartData={ chartData }
					value={ total }
					styles={ segmentStyles }
					emptyStateIcon={ device }
					comparisonValue={ hasComparison ? comparisonTotal : null }
					legendData={ legendData }
					showLegend={ true }
					dataFormat={ {
						type: 'number',
						options: { useMultipliers: true, decimals: 0 },
					} }
					withTooltips
				/>
			</Stack>
			{ isRefetching && <WidgetLoadingOverlay /> }
		</>
	);
}

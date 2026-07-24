/**
 * External dependencies
 */
import { useReportSessionsByDevice } from '@jetpack-premium-analytics/data';
import { device } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { useMemo } from 'react';
import { SemiCircleChart, WidgetState } from '../../components';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../../components/widget-root';
import { buildSessionsByDeviceData, isEmptyPieChartData } from '../../helpers';
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

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportSessionsByDevice( reportParams );

	const { chartData, total, comparisonTotal, legendData } = useMemo(
		() => buildSessionsByDeviceData( primary.data, comparison.data ),
		[ primary.data, comparison.data ]
	);

	const segmentStyles = useSegmentStyles( chartData );

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
					"We couldn't load sessions data. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: device,
				description: __( 'No session data in this period.', 'jetpack-premium-analytics' ),
			} }
		>
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
		</WidgetState>
	);
}

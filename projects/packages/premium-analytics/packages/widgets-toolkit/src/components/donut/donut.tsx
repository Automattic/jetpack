/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
import { useMemo, type JSX } from 'react';
/**
 * Internal dependencies
 */
import { useChartRoleColor, useSegmentStyles } from '../../hooks';
import { DonutChart } from '../chart-donut/donut-chart';
import { DonutChartSkeleton } from '../chart-donut/donut-chart-skeleton';
import {
	WidgetState,
	resolveWidgetStateError,
	type WidgetStateEmpty,
	type WidgetStateError,
} from '../widget-state';
import { buildDonutChartData, type DonutSegmentInput } from './build-donut-chart-data';
import styles from './donut.module.scss';
import type { DataFormat, WidgetStatus } from '../../types';

export type DonutProps = {
	/**
	 * Segments of the breakdown, in display order.
	 */
	segments: readonly DonutSegmentInput[];
	/**
	 * Request state, from the widget's data hook.
	 */
	status: WidgetStatus;
	/**
	 * Error copy and actions, as `describeError()` builds them. Omit for the generic
	 * message with a Retry bound to `status.refetch`.
	 */
	error?: WidgetStateError;
	/**
	 * A widget's own empty state; omit for the generic one.
	 */
	empty?: WidgetStateEmpty;
	/**
	 * Format of the segment values and the total. Defaults to compact integers.
	 */
	format?: DataFormat;
};

const DEFAULT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

// The value the catalog's `surface-secondary` role maps to, until the role itself has been read.
const MUTED_FALLBACK = '#f4f4f4';

/**
 * A breakdown widget body: the donut chart with the total in the center, the legend with a
 * value and delta per segment, and the loading, error and empty states. Renders inside
 * `WidgetRoot`, whose charts provider colors the segments.
 *
 * @param {DonutProps} props - The props for the Donut component.
 * @return {JSX.Element} The Donut component.
 */
export function Donut( {
	segments,
	status,
	error,
	empty,
	format = DEFAULT_FORMAT,
}: DonutProps ): JSX.Element {
	const { isLoading, isFetching, isError, refetch } = status;
	const hasComparison = !! status.hasComparison;
	const [ rootRef, mutedColor ] = useChartRoleColor< HTMLDivElement >(
		'surface-secondary',
		MUTED_FALLBACK
	);
	const segmentStyles = useSegmentStyles( segments );

	const { chartData, legendData, total, previousTotal } = useMemo(
		() =>
			buildDonutChartData( segments, {
				hasComparison,
				format,
				styles: segmentStyles,
				mutedColor,
			} ),
		[ segments, hasComparison, format, segmentStyles, mutedColor ]
	);
	const errorState = useMemo( () => resolveWidgetStateError( error, refetch ), [ error, refetch ] );

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ !! isError }
			isEmpty={ total === 0 }
			error={ errorState }
			empty={ empty }
			renderLoading={ <DonutChartSkeleton /> }
		>
			<Stack
				ref={ rootRef }
				className={ styles.root }
				direction="column"
				align="center"
				justify="center"
			>
				<DonutChart
					chartData={ chartData }
					value={ total }
					comparisonValue={ previousTotal }
					dataFormat={ format }
					legendData={ legendData }
					maxSize={ null }
					withTooltips
				/>
			</Stack>
		</WidgetState>
	);
}

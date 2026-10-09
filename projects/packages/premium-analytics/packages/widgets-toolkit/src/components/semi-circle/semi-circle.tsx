/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
import { useMemo, type JSX } from 'react';
/**
 * Internal dependencies
 */
import { useChartRoleColor, useSegmentStyles } from '../../hooks';
import { DonutChartSkeleton } from '../chart-donut/donut-chart-skeleton';
import { SemiCircleChart } from '../chart-semi-circle/semi-circle-chart';
import { buildDonutChartData, type DonutSegmentInput } from '../donut/build-donut-chart-data';
import {
	WidgetState,
	resolveWidgetStateError,
	type WidgetStateEmpty,
	type WidgetStateError,
} from '../widget-state';
import styles from './semi-circle.module.scss';
import type { DataFormat, WidgetStatus } from '../../types';

/**
 * One segment of the breakdown, as `Donut` takes it.
 */
export type SemiCircleSegmentInput = DonutSegmentInput;

export type SemiCircleProps = {
	/**
	 * The whole breakdown, in display order. A segment with no value in the period draws no
	 * arc but keeps its legend row and its comparison value.
	 */
	segments: readonly SemiCircleSegmentInput[];
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
	/**
	 * Whether the total of the segments shows under the arc. Off for shares that add up to one.
	 * Defaults to on.
	 */
	withTotal?: boolean;
};

const DEFAULT_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

// The value the catalog's `surface-secondary` role maps to, until the role itself has been read.
const MUTED_FALLBACK = '#f4f4f4';

/**
 * A breakdown widget body drawn as a half ring: the total under the arc, the legend with a
 * value and delta per segment, and the loading, error and empty states. Renders inside
 * `WidgetRoot`, whose charts provider colors the segments.
 *
 * @param {SemiCircleProps} props - The props for the SemiCircle component.
 * @return {JSX.Element} The SemiCircle component.
 */
export function SemiCircle( {
	segments,
	status,
	error,
	empty,
	format = DEFAULT_FORMAT,
	withTotal = true,
}: SemiCircleProps ): JSX.Element {
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
			<Stack ref={ rootRef } className={ styles.root } direction="column">
				<SemiCircleChart
					chartData={ chartData }
					value={ withTotal ? total : undefined }
					showMetric={ withTotal }
					comparisonValue={ previousTotal }
					dataFormat={ format }
					legendData={ legendData }
					withTooltips
				/>
			</Stack>
		</WidgetState>
	);
}

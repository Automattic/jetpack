/**
 * Internal dependencies
 */
import type { ComparativeLineChartSeries } from '../components/chart-comparative-line/types';

export type ResolvedSeriesNames = {
	/** The current-period label of each `group`, keyed by group. */
	primaryByGroup: Map< string, string >;
	/** The metric name to show for a series label, keyed by that label. */
	seriesNames: Map< string, string >;
	/** Whether the chart was handed more than one metric. */
	isPaired: boolean;
};

/**
 * Resolve each group's current-period series.
 *
 * Both tooltip naming and comparison-date alignment need the same definition
 * of a group's primary: its first non-comparison series.
 *
 * @param series - The series the chart was handed.
 * @return The current-period series keyed by group.
 */
export function resolvePrimarySeriesByGroup(
	series: readonly ComparativeLineChartSeries[]
): Map< string, ComparativeLineChartSeries > {
	const primarySeriesByGroup = new Map< string, ComparativeLineChartSeries >();

	for ( const item of series ) {
		if (
			item.options?.type !== 'comparison' &&
			item.group !== undefined &&
			! primarySeriesByGroup.has( item.group )
		) {
			primarySeriesByGroup.set( item.group, item );
		}
	}

	return primarySeriesByGroup;
}

/**
 * Resolve the metric name each series' tooltip row should lead with.
 *
 * A metric's previous period is folded into its legend item, so a comparison
 * row is named after its group's current period rather than by its own internal
 * label ('Visitors', not 'Visitors · previous period').
 *
 * `isPaired` asks whether the chart was handed more than one metric, not
 * whether both are currently visible: a counterpart seeded hidden can be
 * revealed at any time, and a row label that changed shape as the reader
 * toggled it would be worse than one that always leads with its metric.
 *
 * @param series - The series the chart was handed.
 * @return The group's primary labels, the per-label metric names, and whether more than one metric is present.
 */
export function resolveSeriesNames(
	series: readonly ComparativeLineChartSeries[]
): ResolvedSeriesNames {
	const primarySeriesByGroup = resolvePrimarySeriesByGroup( series );
	const primaryByGroup = new Map(
		Array.from( primarySeriesByGroup, ( [ group, primary ] ) => [ group, primary.label ] )
	);
	let currentCount = 0;

	for ( const item of series ) {
		if ( item.options?.type === 'comparison' ) {
			continue;
		}
		currentCount++;
	}

	const seriesNames = new Map< string, string >();
	for ( const item of series ) {
		seriesNames.set(
			item.label,
			( item.group !== undefined && primaryByGroup.get( item.group ) ) || item.label
		);
	}

	return { primaryByGroup, seriesNames, isPaired: currentCount > 1 };
}

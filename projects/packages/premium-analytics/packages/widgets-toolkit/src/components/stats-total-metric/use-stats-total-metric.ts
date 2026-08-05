/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { defaultPeriodForInterval } from '../../helpers';
import type {
	ReportParams,
	StatsVisitsParams,
	StatsVisitsResponse,
} from '@jetpack-premium-analytics/data';

/**
 * The traffic field a total-metric card displays.
 */
export type StatsTotalMetricField = 'views' | 'visitors';

/**
 * Normalized state for one total-metric card.
 */
export type StatsTotalMetricState = {
	/** The period total, read from the report summary — not a sum of `points`. */
	total: number;
	/** One point per bucket, oldest first. */
	points: number[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
};

// Ordered finest to coarsest, as `defaultPeriodForInterval` requires. Matches
// `traffic-chart`'s set so both land on the same period for a given range —
// the precondition for sharing its query.
const TOTAL_METRIC_PERIODS = [ 'day', 'week', 'month' ] as const;

/**
 * Fetch one traffic field's period total and trend for the dashboard's range.
 *
 * Requests `views,visitors` rather than just `field`: that is the pair
 * `traffic-chart` fetches, so a board carrying all three cards resolves to one
 * cache entry and one request.
 *
 * @param reportParams - The dashboard date range and comparison state.
 * @param field        - The traffic field to display.
 * @return The card's normalized state.
 */
export function useStatsTotalMetric(
	reportParams: ReportParams,
	field: StatsTotalMetricField
): StatsTotalMetricState {
	const period = defaultPeriodForInterval( reportParams.interval, TOTAL_METRIC_PERIODS );

	// The card renders no delta, and `useReport` folds the comparison query's
	// loading/fetching/error flags into the ones returned here — leaving it
	// enabled would make the card wait on, and fail for, data it never shows.
	// Free of charge: `useReport` already deletes these four keys before
	// building the primary query, so the shared cache entry is unaffected.
	const params = useMemo( () => {
		const next: StatsVisitsParams = {
			...reportParams,
			stat_fields: 'views,visitors',
			period,
		};

		delete next.comp;
		delete next.compare_from;
		delete next.compare_to;
		delete next.compare_preset;

		return next;
	}, [ reportParams, period ] );

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );
	const report = primary.data as StatsVisitsResponse | undefined;

	const points = useMemo(
		() =>
			( report?.data ?? [] ).map( row =>
				Number( ( row as Record< string, unknown > )[ field ] ?? 0 )
			),
		[ report, field ]
	);

	return {
		total: Number( report?.summary?.[ field ] ?? 0 ),
		points,
		isLoading,
		isFetching,
		// `placeholderData` keeps the prior rows on a transient refetch failure,
		// so only surface the error when there is nothing left to show.
		isError: isError && points.length === 0,
		error,
		refetch,
	};
}

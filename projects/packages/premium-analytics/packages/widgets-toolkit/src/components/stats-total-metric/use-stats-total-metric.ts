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

export type StatsTotalMetricField = 'views' | 'visitors';

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

// Finest to coarsest, as `defaultPeriodForInterval` requires. Same set as
// `traffic-chart`, so both land on the same period and share its query.
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

	// `useReport` folds the comparison query's loading/error flags into the ones
	// returned here, so leaving it enabled would make the card wait on — and fail
	// for — data it never renders. Costs nothing: `useReport` already strips these
	// keys from the primary query, so the shared cache entry is unaffected.
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

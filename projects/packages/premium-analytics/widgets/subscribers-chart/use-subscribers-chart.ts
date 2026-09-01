/**
 * External dependencies
 */
import {
	useStatsSubscribersReport,
	type ReportParams,
	type StatsSubscribersResponse,
	type StatsSubscribersUnit,
} from '@jetpack-premium-analytics/data';
import { toChartDate } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * Granularity the chart can be grouped by. Maps directly to the WPCOM stats
 * `unit` query param and is layered onto the dashboard range as its `period`.
 */
export type SubscribersPeriod = Extract< StatsSubscribersUnit, 'day' | 'week' | 'month' >;

/**
 * A single normalized point on the subscribers chart.
 */
export interface SubscribersChartPoint {
	date: Date;
	subscribers: number;
	paid: number;
}

/**
 * Current and previous period subscriber series. Per-metric headline totals are
 * derived in the widget from the last point of each window.
 */
export interface SubscribersChartState {
	current: SubscribersChartPoint[];
	previous: SubscribersChartPoint[];
	hasPaid: boolean;
	isLoading: boolean;
	/** True while either window is fetching, including granularity-switch refetches. */
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
}

// Wall clocks, not instants — the chart reads them back via
// `pointsAreWallClocks` (rationale in `chart-date.ts`).
function toPoints( report: StatsSubscribersResponse | undefined ): SubscribersChartPoint[] {
	return ( report?.data ?? [] ).map( point => ( {
		date: toChartDate( point.date_start ),
		subscribers: Number( point.subscribers ?? point.value ?? 0 ),
		paid: Number( point.subscribers_paid ?? 0 ),
	} ) );
}

/**
 * Fetches the subscribers time series for the dashboard's date range and
 * bucket size, including the comparison window when the dashboard requests it.
 */
export default function useSubscribersChart(
	reportParams: ReportParams,
	period: SubscribersPeriod
): SubscribersChartState {
	const params = useMemo( () => ( { ...reportParams, period } ), [ reportParams, period ] );
	const report = useStatsSubscribersReport( params );

	const current = useMemo( () => toPoints( report.primary.data ), [ report.primary.data ] );
	const previous = useMemo( () => toPoints( report.comparison.data ), [ report.comparison.data ] );

	return {
		current,
		previous,
		hasPaid: current.some( point => point.paid > 0 ),
		isLoading: report.isLoading,
		isFetching: report.isFetching,
		// `placeholderData` keeps stale points in `current` after a failed refetch; only
		// surface the error once there is nothing on screen to show.
		isError: current.length === 0 && report.isError,
		refetch: report.refetch,
	};
}

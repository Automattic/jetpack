/**
 * External dependencies
 */
import {
	useStatsSubscribersReport,
	localTZDate,
	type ReportParams,
	type StatsSubscribersResponse,
	type StatsSubscribersUnit,
} from '@jetpack-premium-analytics/data';
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
	error: Error | null | undefined;
	refetch: () => void;
}

/**
 * Map a normalized subscribers report into the chart's point shape.
 *
 * @param report - The normalized report, or undefined while loading.
 * @return One point per period, oldest first.
 */
function toPoints( report: StatsSubscribersResponse | undefined ): SubscribersChartPoint[] {
	return ( report?.data ?? [] ).map( point => ( {
		date: localTZDate( point.date_start ),
		subscribers: Number( point.subscribers ?? point.value ?? 0 ),
		paid: Number( point.subscribers_paid ?? 0 ),
	} ) );
}

/**
 * Fetch the subscribers time series for the dashboard's date range at the
 * selected granularity, together with the dashboard comparison window.
 *
 * The dashboard date range drives the window and the previous-period overlay is
 * driven by the dashboard's comparison state; the in-body granularity control
 * only overrides which `unit` the range is bucketed into. Both windows are
 * fetched by `useStatsSubscribersReport`, which layers the comparison range on
 * top of `reportParams`.
 *
 * @param reportParams - The dashboard report params (date range + comparison).
 * @param period       - Selected granularity (day/week/month).
 * @return The current/previous series, totals, and load state.
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
		isError: report.isError,
		error: report.error,
		refetch: report.refetch,
	};
}

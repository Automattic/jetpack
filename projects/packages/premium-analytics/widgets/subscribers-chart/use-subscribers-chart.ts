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
	refetch: () => void;
}

function toPoints( report: StatsSubscribersResponse | undefined ): SubscribersChartPoint[] {
	return ( report?.data ?? [] ).map( point => ( {
		date: localTZDate( point.date_start ),
		subscribers: Number( point.subscribers ?? point.value ?? 0 ),
		paid: Number( point.subscribers_paid ?? 0 ),
	} ) );
}

/**
 * Fetch the subscribers time series for the dashboard's date range at the
 * given bucket size, together with the dashboard comparison window.
 *
 * The dashboard drives all three: the range, the previous-period overlay via
 * its comparison state, and `period` via its chart interval control. Both
 * windows are fetched by `useStatsSubscribersReport`, which layers the
 * comparison range on top of `reportParams`.
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
		// The Stats queries carry `placeholderData: previousData => previousData`, so a
		// failed range change keeps the prior period's points in `current` while
		// `isError` flips true. Only surface the error when there's nothing to show,
		// so a transient refetch failure doesn't replace a populated chart with the
		// error state.
		isError: current.length === 0 && report.isError,
		refetch: report.refetch,
	};
}

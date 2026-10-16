/**
 * External dependencies
 */
import {
	useStatsSubscribersReport,
	type ReportParams,
	type StatsSubscribersResponse,
	type StatsSubscribersUnit,
} from '@jetpack-premium-analytics/data';
import { resolveBucketStamp } from '@jetpack-premium-analytics/datetime';
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
	subscribers: number | null;
	paid: number | null;
}

/**
 * The subscriber series for the selected window. Per-metric headline totals are
 * derived in the widget from its last point.
 */
export interface SubscribersChartState {
	current: SubscribersChartPoint[];
	hasPaid: boolean;
	isLoading: boolean;
	/** True while fetching, including granularity-switch refetches. */
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
}

function toPoints(
	report: StatsSubscribersResponse | undefined,
	zone: string
): SubscribersChartPoint[] {
	return ( report?.data ?? [] ).flatMap( point => {
		const date = resolveBucketStamp( point.date_start, zone );

		return date
			? [
					{
						date,
						subscribers:
							point.subscribers === null ? null : Number( point.subscribers ?? point.value ?? 0 ),
						paid: point.subscribers_paid === null ? null : Number( point.subscribers_paid ?? 0 ),
					},
				]
			: [];
	} );
}

/**
 * Fetches the subscribers time series for the widget's date range and bucket
 * size. The widget scopes itself out of comparison, so there is no second window.
 */
export default function useSubscribersChart(
	reportParams: ReportParams,
	period: SubscribersPeriod
): SubscribersChartState {
	const params = useMemo( () => ( { ...reportParams, period } ), [ reportParams, period ] );
	const report = useStatsSubscribersReport( params );

	const zone = report.timezone;
	const current = useMemo(
		() => toPoints( report.primary.data, zone ),
		[ report.primary.data, zone ]
	);

	return {
		current,
		hasPaid: current.some( point => ( point.paid ?? 0 ) > 0 ),
		isLoading: report.isLoading,
		isFetching: report.isFetching,
		// `placeholderData` keeps stale points in `current` after a failed refetch; only
		// surface the error once there is nothing on screen to show.
		isError: current.length === 0 && report.isError,
		refetch: report.refetch,
	};
}

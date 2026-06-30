/**
 * External dependencies
 */
import {
	useStatsSubscribers,
	localTZDate,
	type StatsSubscribersResponse,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
import { format, sub, type Duration } from 'date-fns';

/**
 * Granularity the chart can be grouped by. Maps directly to the WPCOM stats
 * `unit` query param.
 */
export type SubscribersPeriod = 'day' | 'week' | 'month';

/**
 * How many periods to request per granularity, and the matching `date-fns`
 * duration key used to step back one full window for the previous period.
 */
const PERIOD_CONFIG: Record< SubscribersPeriod, { quantity: number; unit: keyof Duration } > = {
	day: { quantity: 30, unit: 'days' },
	week: { quantity: 12, unit: 'weeks' },
	month: { quantity: 12, unit: 'months' },
};

const DATE_FORMAT = 'yyyy-MM-dd';

/**
 * A single normalized point on the subscribers chart.
 */
export interface SubscribersChartPoint {
	date: Date;
	subscribers: number;
	paid: number;
}

/**
 * Current and previous period subscriber series plus the headline totals.
 */
export interface SubscribersChartState {
	current: SubscribersChartPoint[];
	previous: SubscribersChartPoint[];
	currentTotal: number;
	previousTotal: number;
	hasPaid: boolean;
	isLoading: boolean;
	isError: boolean;
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
 * The latest subscriber total in a window is its final point — each point is
 * the cumulative count as of that period, so the headline value is the last
 * one rather than a sum across points.
 *
 * @param points - Chart points, oldest first.
 * @return The latest subscriber total, or 0 when there is no data.
 */
function latestTotal( points: SubscribersChartPoint[] ): number {
	return points.length ? points[ points.length - 1 ].subscribers : 0;
}

/**
 * Fetch the subscribers time series for the selected granularity, together
 * with the immediately preceding window so the chart can overlay the previous
 * period and the headline can show a period-over-period delta.
 *
 * Both windows request `quantity` periods; the previous window simply ends one
 * full window earlier. `useStatsSubscribers` is the designated Stats data hook
 * (a non-time-series TanStack query result — no `primary`/`comparison` shape).
 *
 * @param period        - Selected granularity (day/week/month).
 * @param referenceDate - The window's end date; defaults to now. Injectable for
 *                      deterministic tests/stories.
 * @return The current/previous series, totals, and load state.
 */
export default function useSubscribersChart(
	period: SubscribersPeriod,
	referenceDate: Date = new Date()
): SubscribersChartState {
	const { quantity, unit } = PERIOD_CONFIG[ period ];

	const currentDate = format( referenceDate, DATE_FORMAT );
	const previousDate = format( sub( referenceDate, { [ unit ]: quantity } ), DATE_FORMAT );

	const currentQuery = useStatsSubscribers( { unit: period, quantity, date: currentDate } );
	const previousQuery = useStatsSubscribers( { unit: period, quantity, date: previousDate } );

	const current = useMemo(
		() => toPoints( currentQuery.data as StatsSubscribersResponse | undefined ),
		[ currentQuery.data ]
	);
	const previous = useMemo(
		() => toPoints( previousQuery.data as StatsSubscribersResponse | undefined ),
		[ previousQuery.data ]
	);

	return {
		current,
		previous,
		currentTotal: latestTotal( current ),
		previousTotal: latestTotal( previous ),
		hasPaid: current.some( point => point.paid > 0 ),
		isLoading: currentQuery.isLoading || previousQuery.isLoading,
		isError: currentQuery.isError || previousQuery.isError,
	};
}

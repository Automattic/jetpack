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
 * Fetch the subscribers time series for the selected granularity, together
 * with the immediately preceding window so the chart can overlay the previous
 * period and the headline can show a period-over-period delta.
 *
 * Both windows request `quantity` periods; the previous window simply ends one
 * full window earlier. `useStatsSubscribers` is the designated Stats data hook
 * (a non-time-series TanStack query result — no `primary`/`comparison` shape).
 *
 * @param period        - Selected granularity (day/week/month).
 * @param referenceDate - The window's end date; defaults to "today" in the
 *                      site timezone (like other Stats widgets) so the terminal
 *                      bucket is correct regardless of the viewer's timezone.
 *                      Injectable for deterministic tests/stories.
 * @return The current/previous series, totals, and load state.
 */
export default function useSubscribersChart(
	period: SubscribersPeriod,
	referenceDate: Date = localTZDate()
): SubscribersChartState {
	const { quantity, unit } = PERIOD_CONFIG[ period ];

	const currentDate = format( referenceDate, DATE_FORMAT );
	const previousDate = format( sub( referenceDate, { [ unit ]: quantity } ), DATE_FORMAT );

	const currentQuery = useStatsSubscribers( { unit: period, quantity, date: currentDate } );
	const previousQuery = useStatsSubscribers( { unit: period, quantity, date: previousDate } );

	const current = useMemo( () => toPoints( currentQuery.data ), [ currentQuery.data ] );
	const previous = useMemo( () => toPoints( previousQuery.data ), [ previousQuery.data ] );

	return {
		current,
		previous,
		hasPaid: current.some( point => point.paid > 0 ),
		isLoading: currentQuery.isLoading || previousQuery.isLoading,
		isFetching: currentQuery.isFetching || previousQuery.isFetching,
		isError: currentQuery.isError || previousQuery.isError,
	};
}

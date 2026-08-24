/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	STATS_CHART_BUCKET_PERIODS,
	type StatsChartBucketPeriod,
	IntervalType,
} from '@jetpack-premium-analytics/data';
import { defaultPeriodForInterval } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * The buckets these charts draw, as an `IntervalType` list. They sum daily
 * history client-side, so the `hour` a one-day range offers and the
 * `quarter`/`year` a multi-year range offers are all coerced into this set
 * before a chart ever sees them.
 */
const HONOURED_INTERVALS: readonly IntervalType[] = STATS_CHART_BUCKET_PERIODS;

type DetailChartIntervals = {
	withIntervalControl: true;
	interval: IntervalType;
	intervalOptions: IntervalType[];
};

/**
 * Narrow a detail page's interval control to the buckets its charts honour.
 *
 * Listing a bucket the charts coerce away makes the control lie: on Today,
 * Yesterday, or Last 24 hours the range allows only `hour`, so an unfiltered
 * menu would show **By hours** as its one checked option while the chart drew a
 * single daily bucket.
 *
 * The narrowing can leave nothing — a range finer than a day, or coarser than a
 * month. The charts still draw their clamped bucket, so the control names that
 * one rather than disappear, which is the policy the dashboard control already
 * follows for a range with a single allowed bucket.
 *
 * @param interval        - The interval the date-filter controller resolved.
 * @param intervalOptions - The buckets that range allows, finest first.
 * @return The interval props to pass to `DateFiltersPanel`.
 */
export function useDetailChartIntervals(
	interval: IntervalType,
	intervalOptions: IntervalType[]
): DetailChartIntervals {
	return useMemo( () => {
		// The predicate narrows to the honoured buckets' own type, which
		// `defaultPeriodForInterval` requires — `quarter` is an IntervalType but
		// not a bucket a Stats request accepts.
		const honoured = intervalOptions.filter( ( option ): option is StatsChartBucketPeriod =>
			HONOURED_INTERVALS.includes( option )
		);
		const offered = honoured.length
			? honoured
			: [ defaultPeriodForInterval( interval, STATS_CHART_BUCKET_PERIODS ) ];

		const [ finest, ...rest ] = offered;

		return {
			withIntervalControl: true,
			// The same clamp the charts apply, so the checked item names the
			// bucket they actually draw.
			interval: defaultPeriodForInterval( interval, [ finest, ...rest ] ),
			intervalOptions: offered,
		};
	}, [ interval, intervalOptions ] );
}

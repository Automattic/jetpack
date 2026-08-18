/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { STATS_CHART_BUCKET_PERIODS } from '@jetpack-premium-analytics/data';
import { defaultPeriodForInterval } from '@jetpack-premium-analytics/widgets-toolkit';
import type { IntervalType } from '@jetpack-premium-analytics/data';

/**
 * The buckets these charts draw, as an `IntervalType` list. They sum daily
 * history client-side, so the `hour` a one-day range offers and the
 * `quarter`/`year` a multi-year range offers are all coerced into this set
 * before a chart ever sees them.
 */
const HONOURED_INTERVALS: readonly IntervalType[] = STATS_CHART_BUCKET_PERIODS;

type DetailChartIntervals = {
	withIntervalControl: boolean;
	interval: IntervalType;
	intervalOptions: IntervalType[];
};

/**
 * Narrow a detail page's interval control to the buckets its charts honour.
 *
 * Listing a bucket the charts coerce away makes the control lie: on Today,
 * Yesterday, or Last 24 hours the range allows only `hour`, so the menu would
 * show **By hours** as its one checked option while the chart drew a single
 * daily bucket. Those ranges get no control at all; a range that mixes honoured
 * and coerced buckets keeps only the honoured ones.
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
		const honoured = intervalOptions.filter( option => HONOURED_INTERVALS.includes( option ) );

		if ( ! honoured.length ) {
			return { withIntervalControl: false, interval, intervalOptions: [] };
		}

		const [ finest, ...rest ] = honoured;

		return {
			withIntervalControl: true,
			// The same clamp the charts apply, so the checked item names the
			// bucket they actually draw.
			interval: defaultPeriodForInterval( interval, [ finest, ...rest ] ),
			intervalOptions: [ finest, ...rest ],
		};
	}, [ interval, intervalOptions ] );
}

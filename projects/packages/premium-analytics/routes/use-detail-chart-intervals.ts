/**
 * External dependencies
 */
import { useMemo } from '@wordpress/element';
import { defaultPeriodForInterval } from '@jetpack-premium-analytics/widgets-toolkit';
import type { IntervalType } from '@jetpack-premium-analytics/data';

/**
 * The buckets the detail pages' charts can draw. Their series are summed from
 * daily history client-side, so the `hour` interval a one-day range offers and
 * the `quarter`/`year` intervals a multi-year range offers are all coerced into
 * this set before a chart ever sees them.
 */
const DETAIL_CHART_INTERVALS: readonly IntervalType[] = [ 'day', 'week', 'month' ];

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
		const honoured = intervalOptions.filter( option => DETAIL_CHART_INTERVALS.includes( option ) );

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

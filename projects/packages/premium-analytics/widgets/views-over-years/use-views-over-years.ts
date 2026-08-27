/**
 * External dependencies
 */
import {
	computeDateRangeFromPreset,
	localTZDate,
	useStatsVisits,
	type StatsVisitsParams,
} from '@jetpack-premium-analytics/data';
import { PRESET_ALL_TIME } from '@jetpack-premium-analytics/datetime';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildViewsOverYears, type ViewsOverYearsMetric } from './build-views-over-years';

/**
 * How far back the request reaches. Nothing on the client knows when the site
 * started — `getStoreInfo()` is still a stub — so the range is floored at the
 * year WordPress.com Stats itself begins, which no site can have views before.
 * Months before the site's own first are trimmed off the table afterwards.
 */
const STATS_EPOCH_YEAR = 2005;

/**
 * Every year of site views, month by month.
 *
 * All time regardless of the section's year selection, like the Stats card it
 * replaces: the table's own row labels say which years it covers, and a single
 * year would leave it with one row.
 *
 * @param metric - Which number each cell reports.
 * @return The rows and the request's state.
 */
export function useViewsOverYears( metric: ViewsOverYearsMetric ) {
	// `startYear`, not `startDate`: the year resolves to its own January 1 in the
	// site's timezone, where an instant would land a day either side of it.
	const range = useMemo(
		() => computeDateRangeFromPreset( PRESET_ALL_TIME, { startYear: STATS_EPOCH_YEAR } ),
		[]
	);

	const params = useMemo< StatsVisitsParams >(
		() => ( {
			// An unresolvable range leaves both ends empty, which is what
			// `statsVisitsQuery` already treats as "nothing to request".
			from: range?.from ?? '',
			to: range?.to ?? '',
			interval: 'month',
			period: 'month',
			stat_fields: 'views',
		} ),
		[ range ]
	);

	// Read off the range's own end rather than the clock, so the current-month
	// cap and the request can never resolve against different days.
	const today = useMemo( () => localTZDate( range?.to ), [ range ] );

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );

	const rows = useMemo(
		() => buildViewsOverYears( primary.data, metric, today ),
		[ primary.data, metric, today ]
	);

	return { rows, isLoading, isFetching, isError, error, refetch };
}

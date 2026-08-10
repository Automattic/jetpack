/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import {
	useWidgetRootContext,
	withoutComparison,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { bucketViewsByWeekday, pickPeakWeekday } from './bucket-views-by-weekday';
import type { StatsVisitsParams, StatsVisitsResponse } from '@jetpack-premium-analytics/data';

// Pinned rather than taken from the dashboard interval: weekday buckets can only
// be rebuilt from daily rows, and a weekly or monthly bucket would silently
// collapse the very distribution this widget draws.
const PERIOD = 'day';

// Matches the request `total-views` and `total-visitors` make, so all three
// widgets share one cache entry instead of issuing near-identical requests.
const STAT_FIELDS = 'views,visitors';

/**
 * Views folded into one bucket per day of the week, for the dashboard's range.
 *
 * `stats/insights` also reports a weekday breakdown, but over a window fixed at
 * ten weeks and with no date parameters at all, so it cannot follow the date
 * picker. `stats/visits` has no such cap and reports site-local dates.
 */
export function usePopularDays() {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo< StatsVisitsParams >(
		() => withoutComparison( { ...reportParams, stat_fields: STAT_FIELDS, period: PERIOD } ),
		[ reportParams ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );
	const report = primary.data as StatsVisitsResponse | undefined;

	const buckets = useMemo(
		() => bucketViewsByWeekday( ( report?.data ?? [] ) as Record< string, unknown >[] ),
		[ report ]
	);

	return {
		buckets,
		peak: useMemo( () => pickPeakWeekday( buckets ), [ buckets ] ),
		isLoading,
		isFetching,
		isError,
		error,
		refetch,
	};
}

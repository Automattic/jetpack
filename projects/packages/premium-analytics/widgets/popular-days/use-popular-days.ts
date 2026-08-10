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

// Pinned, not taken from the dashboard interval: a weekly or monthly bucket
// collapses the very distribution this widget draws.
const PERIOD = 'day';

// Matches what `total-views` and `total-visitors` request, so all three share
// one cache entry instead of issuing near-identical requests.
const STAT_FIELDS = 'views,visitors';

/**
 * Views folded into one bucket per day of the week, for the dashboard's range.
 *
 * Not `stats/insights`, which reports the same breakdown over a window fixed at
 * ten weeks and takes no date parameters, so it cannot follow the date picker.
 */
export function usePopularDays() {
	const { reportParams } = useWidgetRootContext();

	const params = useMemo< StatsVisitsParams >(
		() => withoutComparison( { ...reportParams, stat_fields: STAT_FIELDS, period: PERIOD } ),
		[ reportParams ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );
	const report = primary.data as StatsVisitsResponse | undefined;

	const buckets = useMemo( () => bucketViewsByWeekday( report?.data ?? [] ), [ report ] );

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

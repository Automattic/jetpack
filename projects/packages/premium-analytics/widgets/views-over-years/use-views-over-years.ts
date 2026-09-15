/**
 * External dependencies
 */
import { useStatsVisits, type StatsVisitsParams } from '@jetpack-premium-analytics/data';
import { localTZDate } from '@jetpack-premium-analytics/datetime';
import type {
	MonthKey,
	MonthlyHeatmapMetric,
	MonthlyHeatmapRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { format, isValid, parseISO } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildViewsOverYearsRows, type MonthBucket } from './build-views-over-years';

// Before any WordPress.com site existed; the endpoint's DB walk stops at the site's registration.
const EARLIEST_STATS_DATE = '2005-01-01';

export interface ViewsOverYearsState {
	rows: MonthlyHeatmapRow[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
}

/** The bucket's month from the sanitizer's `yyyy-MM-dd` label; a label it cannot read is dropped. */
function readMonthKey( label: string ): MonthKey | null {
	const date = parseISO( label );

	return isValid( date ) ? { year: date.getFullYear(), month: date.getMonth() } : null;
}

/**
 * Every month of the site's views, one row per year. All-time regardless of
 * the section's year filter: one `stats/visits` request at `unit=month` over
 * the site's whole history.
 *
 * @param metric - Which number each cell reports.
 * @return The rows and the request's state.
 */
export default function useViewsOverYears( metric: MonthlyHeatmapMetric ): ViewsOverYearsState {
	// Read in the site timezone so the months fall on the site's own calendar;
	// one reading, so a render across midnight cannot split the window and the rows.
	const today = format( localTZDate(), 'yyyy-MM-dd' );

	const params = useMemo< StatsVisitsParams >(
		() => ( {
			from: EARLIEST_STATS_DATE,
			to: today,
			period: 'month',
			stat_fields: 'views',
		} ),
		[ today ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );

	const rows = useMemo( () => {
		const buckets = ( primary.data?.data ?? [] ).flatMap( ( row ): MonthBucket[] => {
			const month = readMonthKey( row.time_interval );

			return month ? [ { month, views: Number( row.views ?? 0 ) } ] : [];
		} );

		return buildViewsOverYearsRows( buckets, metric, parseISO( today ) );
	}, [ primary.data, metric, today ] );

	return { rows, isLoading, isFetching, isError, error, refetch };
}

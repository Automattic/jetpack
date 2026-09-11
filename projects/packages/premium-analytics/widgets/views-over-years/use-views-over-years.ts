/**
 * External dependencies
 */
import { useStatsVisits, type StatsVisitsParams } from '@jetpack-premium-analytics/data';
import { localTZDate } from '@jetpack-premium-analytics/datetime';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { buildViewsOverYearsRows, type ViewsOverYearsMetric } from './build-views-over-years';
import type { MonthlyHeatmapRow } from '@jetpack-premium-analytics/widgets-toolkit';

// Before any WordPress.com site existed. The endpoint walks no further back
// than the site's own registration, so this costs nothing beyond its history.
const EARLIEST_STATS_DATE = '2005-01-01';

export interface ViewsOverYearsState {
	rows: MonthlyHeatmapRow[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
}

/**
 * Every month of the site's views, one row per year. All-time regardless of
 * the section's year filter: one `stats/visits` request at `unit=month` over
 * the site's whole history.
 *
 * @param metric - Which number each cell reports.
 * @return The rows and the request's state.
 */
export default function useViewsOverYears( metric: ViewsOverYearsMetric ): ViewsOverYearsState {
	// Read in the site timezone so the months fall on the site's own calendar;
	// one reading, so a render across midnight cannot split the window and the rows.
	const today = format( localTZDate(), 'yyyy-MM-dd' );

	const params = useMemo< StatsVisitsParams >(
		() => ( {
			from: EARLIEST_STATS_DATE,
			to: today,
			interval: 'month',
			period: 'month',
			stat_fields: 'views',
		} ),
		[ today ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );

	const rows = useMemo( () => {
		const [ year, month, day ] = today.split( '-' ).map( Number );
		const buckets = ( primary.data?.data ?? [] ).map( row => ( {
			date: String( row.time_interval ?? '' ),
			views: Number( row.views ?? 0 ),
		} ) );

		return buildViewsOverYearsRows( buckets, metric, { year, month: month - 1, day } );
	}, [ primary.data, metric, today ] );

	return { rows, isLoading, isFetching, isError, error, refetch };
}

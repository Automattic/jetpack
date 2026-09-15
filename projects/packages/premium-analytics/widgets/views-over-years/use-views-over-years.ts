/**
 * External dependencies
 */
import {
	useStatsAppSite,
	useStatsVisits,
	type StatsVisitsParams,
} from '@jetpack-premium-analytics/data';
import {
	localTZDate,
	parseSiteDateTime,
	reportingTimeZone,
} from '@jetpack-premium-analytics/datetime';
import {
	monthlyHeatmapLifeStart,
	type MonthKey,
	type MonthlyHeatmapMetric,
	type MonthlyHeatmapRow,
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
	/** Where the site's life starts, which a picked period never precedes. */
	lifeStartsAt: Date | undefined;
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
 * the site's whole history, plus the site's registration date, which opens
 * the first month. Without it the first month divides by its full length.
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
			interval: 'month',
			period: 'month',
			stat_fields: 'views',
		} ),
		[ today ]
	);

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params );
	const site = useStatsAppSite();

	const registeredAt = useMemo(
		() => parseSiteDateTime( site.data?.options?.created_at ),
		[ site.data ]
	);

	const { rows, lifeStartsAt } = useMemo( () => {
		const buckets = ( primary.data?.data ?? [] ).flatMap( ( row ): MonthBucket[] => {
			const month = readMonthKey( row.time_interval );

			return month ? [ { month, views: Number( row.views ?? 0 ) } ] : [];
		} );
		const built = buildViewsOverYearsRows( buckets, metric, parseISO( today ), registeredAt );

		return {
			rows: built,
			lifeStartsAt: monthlyHeatmapLifeStart( built, registeredAt, reportingTimeZone() ),
		};
	}, [ primary.data, metric, today, registeredAt ] );

	return {
		rows,
		lifeStartsAt,
		// The rows wait for the registration date so the first month does not
		// re-divide in front of the reader; a failed site request is not an error here.
		isLoading: isLoading || site.isLoading,
		isFetching,
		isError,
		error,
		refetch,
	};
}

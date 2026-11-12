/**
 * External dependencies
 */
import {
	useStatsAuthorAllTime,
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
import { buildViewsOverYearsRows, type DayKey, type MonthBucket } from './build-views-over-years';

// Before any WordPress.com site existed; the endpoint's DB walk stops at the site's registration.
const EARLIEST_STATS_DATE = '2005-01-01';

const DATE_FORMAT = 'yyyy-MM-dd';

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
 * The rows for monthly buckets, opening the first month on its first day when
 * that day falls inside it.
 *
 * @param buckets - The month buckets.
 * @param metric  - Which number each cell reports.
 * @param today   - The site's current day, `yyyy-MM-dd`.
 * @param opensAt - The first day, as a site-zone instant.
 * @return The rows and where their life starts.
 */
function buildRows(
	buckets: MonthBucket[],
	metric: MonthlyHeatmapMetric,
	today: string,
	opensAt: Date | undefined
) {
	// A site-zone instant, so its getters read the site's calendar, as `today` does.
	const opensOn: DayKey | undefined = opensAt && {
		year: opensAt.getFullYear(),
		month: opensAt.getMonth(),
		day: opensAt.getDate(),
	};
	const rows = buildViewsOverYearsRows( buckets, metric, parseISO( today ), opensOn );

	return { rows, lifeStartsAt: monthlyHeatmapLifeStart( rows, opensAt, reportingTimeZone() ) };
}

const NO_ROWS = { rows: [], lifeStartsAt: undefined };

/**
 * Today on the site's own calendar; one reading, so a render across midnight
 * cannot split the window and the rows.
 *
 * @return The site's current day, `yyyy-MM-dd`.
 */
function useSiteToday(): string {
	return format( localTZDate(), DATE_FORMAT );
}

/**
 * Every month of the site's views: one `stats/visits` request at `unit=month`
 * over the site's whole history, then one at `unit=day` over the first month
 * with views.
 *
 * @param metric  - Which number each cell reports.
 * @param enabled - Whether to read anything.
 * @return The rows and the requests' state.
 */
function useSiteViewsOverYears(
	metric: MonthlyHeatmapMetric,
	enabled: boolean
): ViewsOverYearsState {
	const today = useSiteToday();

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

	const { primary, isLoading, isFetching, isError, error, refetch } = useStatsVisits( params, {
		enabled,
	} );

	const buckets = useMemo(
		() =>
			( primary.data?.data ?? [] ).flatMap( ( row ): MonthBucket[] => {
				const month = readMonthKey( row.time_interval );

				return month ? [ { month, views: Number( row.views ?? 0 ) } ] : [];
			} ),
		[ primary.data ]
	);

	// The sanitizer sorts buckets oldest first.
	const firstMonth = useMemo(
		() => buckets.find( ( { views } ) => views > 0 )?.month,
		[ buckets ]
	);

	// The window is only read once a first month exists; until then the request is off.
	const firstMonthParams = useMemo< StatsVisitsParams >( () => {
		const start = firstMonth ? new Date( firstMonth.year, firstMonth.month, 1 ) : undefined;
		const end = firstMonth ? new Date( firstMonth.year, firstMonth.month + 1, 0 ) : undefined;
		const to = end ? format( end, DATE_FORMAT ) : today;

		return {
			from: start ? format( start, DATE_FORMAT ) : today,
			to: to < today ? to : today,
			interval: 'day',
			period: 'day',
			stat_fields: 'views',
		};
	}, [ firstMonth, today ] );

	const firstMonthDays = useStatsVisits( firstMonthParams, { enabled: enabled && !! firstMonth } );

	const opensAt = useMemo( () => {
		const firstDay = ( firstMonthDays.primary.data?.data ?? [] ).find(
			row => Number( row.views ?? 0 ) > 0
		);

		return parseSiteDateTime( firstDay?.time_interval );
	}, [ firstMonthDays.primary.data ] );

	// Without a response there is no row to draw, not a site without views.
	const { rows, lifeStartsAt } = useMemo(
		() => ( primary.data ? buildRows( buckets, metric, today, opensAt ) : NO_ROWS ),
		[ primary.data, buckets, metric, today, opensAt ]
	);

	// Only the averages wait for the first day, and only until that request first settles:
	// a failed one refetches on focus with no data, which would pull the rows back into the skeleton.
	const awaitingFirstDay =
		metric === 'average' &&
		!! firstMonth &&
		firstMonthDays.isLoading &&
		! firstMonthDays.primary.isFetched;

	return {
		rows,
		lifeStartsAt,
		isLoading: isLoading || awaitingFirstDay,
		isFetching: isFetching || firstMonthDays.isFetching,
		isError,
		error,
		refetch,
	};
}

/**
 * Every month of one author's views: the `stats/author` all-time request, whose
 * first day opens the first month.
 *
 * @param metric   - Which number each cell reports.
 * @param authorId - The author's user ID; `0` reads nothing.
 * @param enabled  - Whether to read anything.
 * @return The rows and the request's state.
 */
function useAuthorViewsOverYears(
	metric: MonthlyHeatmapMetric,
	authorId: number,
	enabled: boolean
): ViewsOverYearsState {
	const today = useSiteToday();
	const { data, isLoading, isFetching, isError, error, refetch } = useStatsAuthorAllTime(
		authorId,
		{ enabled: enabled && authorId > 0 }
	);

	const { rows, lifeStartsAt } = useMemo( () => {
		if ( ! data ) {
			return NO_ROWS;
		}

		const buckets = data.data.flatMap( ( row ): MonthBucket[] => {
			const month = readMonthKey( row.period );

			return month ? [ { month, views: row.views } ] : [];
		} );

		return buildRows( buckets, metric, today, parseSiteDateTime( data.startDate ?? undefined ) );
	}, [ data, metric, today ] );

	return { rows, lifeStartsAt, isLoading, isFetching, isError, error, refetch };
}

/**
 * Every month of views, one row per year, all-time regardless of the page's
 * period: the site's, or with an author, theirs.
 *
 * @param metric   - Which number each cell reports.
 * @param authorId - Scopes the table to one author, reading nothing while it is `0`;
 *                 omitted, the table reads the whole site.
 * @return The rows and the requests' state.
 */
export default function useViewsOverYears(
	metric: MonthlyHeatmapMetric,
	authorId?: number
): ViewsOverYearsState {
	const isAuthorScoped = authorId !== undefined;
	const site = useSiteViewsOverYears( metric, ! isAuthorScoped );
	const author = useAuthorViewsOverYears( metric, authorId ?? 0, isAuthorScoped );

	return isAuthorScoped ? author : site;
}

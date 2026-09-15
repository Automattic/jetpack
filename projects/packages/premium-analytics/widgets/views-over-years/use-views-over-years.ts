/**
 * External dependencies
 */
import { useStatsVisits, type StatsVisitsParams } from '@jetpack-premium-analytics/data';
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
 * Every month of the site's views, one row per year. All-time regardless of
 * the section's year filter: one `stats/visits` request at `unit=month` over
 * the site's whole history, then one at `unit=day` over the first month with views.
 *
 * @param metric - Which number each cell reports.
 * @return The rows and the requests' state.
 */
export default function useViewsOverYears( metric: MonthlyHeatmapMetric ): ViewsOverYearsState {
	// Read in the site timezone so the months fall on the site's own calendar;
	// one reading, so a render across midnight cannot split the window and the rows.
	const today = format( localTZDate(), DATE_FORMAT );

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

	const firstMonthDays = useStatsVisits( firstMonthParams, { enabled: !! firstMonth } );

	const opensAt = useMemo( () => {
		const firstDay = ( firstMonthDays.primary.data?.data ?? [] ).find(
			row => Number( row.views ?? 0 ) > 0
		);

		return parseSiteDateTime( firstDay?.time_interval );
	}, [ firstMonthDays.primary.data ] );

	const { rows, lifeStartsAt } = useMemo( () => {
		// A site-zone instant, so its getters read the site's calendar, as `today` does.
		const opensOn: DayKey | undefined = opensAt && {
			year: opensAt.getFullYear(),
			month: opensAt.getMonth(),
			day: opensAt.getDate(),
		};
		const built = buildViewsOverYearsRows( buckets, metric, parseISO( today ), opensOn );

		return {
			rows: built,
			lifeStartsAt: monthlyHeatmapLifeStart( built, opensAt, reportingTimeZone() ),
		};
	}, [ buckets, metric, today, opensAt ] );

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

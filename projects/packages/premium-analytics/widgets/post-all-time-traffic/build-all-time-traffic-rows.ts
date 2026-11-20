/**
 * External dependencies
 */
import type { StatsPostResponse, StatsPostYear } from '@jetpack-premium-analytics/data';
import {
	MONTHS_IN_YEAR,
	isMonthIncomplete,
	monthOrder,
	toMonthKey,
	type DayKey,
	type MonthlyHeatmapMetric,
	type MonthlyHeatmapTarget,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * A month's figure, or why there is none: `before` predates the post, `after`
 * is still to come.
 */
export type AllTimeTrafficMonth = number | 'before' | 'after';

export type AllTimeTrafficRow = {
	year: number;
	/** One entry per calendar month, January first. */
	months: AllTimeTrafficMonth[];
	/** The year's own figure under the same metric; `null` when the endpoint has none. */
	total: number | null;
};

/** Every month the endpoint reports, as orders. The API keys months `1`-`12`. */
function reportedMonths( years: Record< string, StatsPostYear > ): number[] {
	return Object.entries( years ).flatMap( ( [ year, stats ] ) =>
		Object.keys( stats.months ).map( monthNumber =>
			monthOrder( { year: Number( year ), month: Number( monthNumber ) - 1 } )
		)
	);
}

/**
 * Turns the endpoint's per-year tables into one row per year, newest first.
 *
 * `years` carries each month's views and the year's total, `averages` its views
 * per day with the year under `overall`; the months reported come from `years`
 * under both metrics. A month the endpoint
 * leaves out inside the post's life is a zero, so the grid stays complete, the
 * way the daily heatmap draws every day of its range.
 *
 * @param response    - The sanitized `stats/post` response.
 * @param metric      - Which number each cell reports.
 * @param today       - The site's current day, which closes the last row.
 * @param publishedOn - The day the post was published; defaults to the first
 *                    reported month.
 * @return One row per year of the post's life, newest first, and the months a total cannot compare with a full month: the publish month when the post went out after the 1st, and the current month until its last day. Both empty without stats.
 */
export function buildAllTimeTrafficRows(
	response: StatsPostResponse | undefined,
	metric: MonthlyHeatmapMetric,
	today: Date,
	publishedOn?: DayKey
): { rows: AllTimeTrafficRow[]; partialMonths: MonthlyHeatmapTarget[] } {
	const years = response?.years ?? {};
	const reported = reportedMonths( years );

	// Without its table the average view has nothing to draw: a grid of zeros
	// built from `years` alone would read as a real measurement.
	if ( reported.length === 0 || ( metric === 'average' && ! response?.averages ) ) {
		return { rows: [], partialMonths: [] };
	}

	const source = metric === 'average' ? response.averages : years;
	// A post can carry stats from before its publish date (a rescheduled one),
	// so its life starts at whichever comes first.
	const firstOrder = Math.min( ...reported, publishedOn ? monthOrder( publishedOn ) : Infinity );
	const lastOrder = Math.max( monthOrder( toMonthKey( today ) ), ...reported );
	const firstYear = Math.floor( firstOrder / MONTHS_IN_YEAR );
	const lastYear = Math.floor( lastOrder / MONTHS_IN_YEAR );
	// A publish day outside the first month with stats leaves that month whole,
	// as `monthlyHeatmapLifeStart` does for the Traffic range.
	const firstDay =
		publishedOn && monthOrder( publishedOn ) === firstOrder ? publishedOn : undefined;
	const rows: AllTimeTrafficRow[] = [];
	const partialMonths: MonthlyHeatmapTarget[] = [];

	for ( let year = lastYear; year >= firstYear; year-- ) {
		const stats = source[ String( year ) ];
		const months = Array.from(
			{ length: MONTHS_IN_YEAR },
			( _month, month ): AllTimeTrafficMonth => {
				const key = { year, month };
				const order = monthOrder( key );

				if ( order < firstOrder ) {
					return 'before';
				}

				if ( order > lastOrder ) {
					return 'after';
				}

				if ( isMonthIncomplete( key, metric, today, firstDay ) ) {
					partialMonths.push( key );
				}

				return stats?.months[ String( month + 1 ) ] ?? 0;
			}
		);

		const total = ( metric === 'average' ? stats?.overall : stats?.total ) ?? null;

		rows.push( { year, months, total } );
	}

	return { rows, partialMonths };
}

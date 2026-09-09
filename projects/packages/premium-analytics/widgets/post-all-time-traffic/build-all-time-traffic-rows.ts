/**
 * External dependencies
 */
import type { StatsPostResponse, StatsPostYear } from '@jetpack-premium-analytics/data';

export const MONTHS_IN_YEAR = 12;

/** A calendar month; `month` is zero-based, as `Date` counts it. */
export type MonthKey = { year: number; month: number };

/**
 * A month's figure, or why there is none: `before` predates the post, `after`
 * is still to come.
 */
export type AllTimeTrafficMonth = number | 'before' | 'after';

export type AllTimeTrafficRow = {
	year: number;
	/** One entry per calendar month, January first. */
	months: AllTimeTrafficMonth[];
};

const monthOrder = ( { year, month }: MonthKey ) => year * MONTHS_IN_YEAR + month;

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
 * `years` carries each month's views. A month the endpoint leaves out inside
 * the post's life is a zero, so the grid stays complete, the way the daily
 * heatmap draws every day of its range.
 *
 * @param response  - The sanitized `stats/post` response.
 * @param today     - The site's current month, which closes the last row.
 * @param published - The month the post was published; defaults to the first
 *                  reported month.
 * @return One row per year of the post's life, newest first. Empty without stats.
 */
export function buildAllTimeTrafficRows(
	response: StatsPostResponse | undefined,
	today: MonthKey,
	published?: MonthKey
): AllTimeTrafficRow[] {
	const years = response?.years ?? {};
	const reported = reportedMonths( years );

	if ( reported.length === 0 ) {
		return [];
	}

	// A post can carry stats from before its publish date (a rescheduled one),
	// so its life starts at whichever comes first.
	const firstOrder = Math.min( ...reported, published ? monthOrder( published ) : Infinity );
	const lastOrder = Math.max( monthOrder( today ), ...reported );
	const firstYear = Math.floor( firstOrder / MONTHS_IN_YEAR );
	const lastYear = Math.floor( lastOrder / MONTHS_IN_YEAR );
	const rows: AllTimeTrafficRow[] = [];

	for ( let year = lastYear; year >= firstYear; year-- ) {
		const stats = years[ String( year ) ];
		const months = Array.from(
			{ length: MONTHS_IN_YEAR },
			( _month, month ): AllTimeTrafficMonth => {
				const order = monthOrder( { year, month } );

				if ( order < firstOrder ) {
					return 'before';
				}

				if ( order > lastOrder ) {
					return 'after';
				}

				return stats?.months[ String( month + 1 ) ] ?? 0;
			}
		);

		rows.push( { year, months } );
	}

	return rows;
}

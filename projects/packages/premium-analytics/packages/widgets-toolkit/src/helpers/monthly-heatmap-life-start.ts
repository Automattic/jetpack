/**
 * External dependencies
 */
import { createTZDateFromParts, toLocalTZ } from '@jetpack-premium-analytics/datetime';

type MonthlyRows = readonly { year: number; months: readonly unknown[] }[];

/**
 * Where a monthly heatmap's subject starts, for `PeriodBounds.lifeStartsAt`:
 * the anchor when it falls in the oldest covered month, else that month's
 * first day, so a month the endpoint reports outside the anchor opens whole.
 *
 * @param rows     - The heatmap rows, in any order; a numeric month is a covered one.
 * @param anchor   - The instant the subject started: a post's publish day, a site's first day with views.
 * @param timeZone - The site timezone the months are read in.
 * @return The life's start; the anchor as given, or `undefined`, when no row covers a month.
 */
export function monthlyHeatmapLifeStart(
	rows: MonthlyRows,
	anchor: Date | undefined,
	timeZone: string
): Date | undefined {
	const oldest = rows.reduce< MonthlyRows[ number ] | undefined >(
		( earliest, row ) => ( earliest && earliest.year <= row.year ? earliest : row ),
		undefined
	);
	const month = oldest?.months.findIndex( value => typeof value === 'number' ) ?? -1;

	if ( ! oldest || month < 0 ) {
		return anchor;
	}

	const anchorMonth = anchor && toLocalTZ( anchor, timeZone );

	if ( anchorMonth?.getFullYear() === oldest.year && anchorMonth.getMonth() === month ) {
		return anchor;
	}

	return new Date( createTZDateFromParts( [ oldest.year, month, 1 ], timeZone ).getTime() );
}

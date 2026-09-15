/**
 * External dependencies
 */
import { createTZDateFromParts, toLocalTZ } from '@jetpack-premium-analytics/datetime';

type MonthlyRows = readonly { year: number; months: readonly unknown[] }[];

/**
 * Where a monthly heatmap's subject starts, for `PeriodBounds.lifeStartsAt`:
 * the anchor when it falls in the oldest row's first month, else that month's
 * first day, so a month the endpoint reports outside the anchor opens whole.
 *
 * @param rows     - The heatmap rows, newest first; a numeric month is a covered one.
 * @param anchor   - The instant the subject started, a publish or registration day.
 * @param timeZone - The site timezone the months are read in.
 * @return The life's start, or `undefined` without rows or an anchor.
 */
export function monthlyHeatmapLifeStart(
	rows: MonthlyRows,
	anchor: Date | undefined,
	timeZone: string
): Date | undefined {
	const oldest = rows[ rows.length - 1 ];
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

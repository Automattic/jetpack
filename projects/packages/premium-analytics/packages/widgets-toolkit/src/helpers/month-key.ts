import type { MonthlyHeatmapMetric } from './monthly-heatmap-metric';

export const MONTHS_IN_YEAR = 12;

/** A calendar month; `month` is zero-based, as `Date` counts it. */
export type MonthKey = { year: number; month: number };

/** A calendar day on the site's own calendar, as `MonthKey` counts it. */
export type DayKey = MonthKey & { day: number };

/** The month's position in a single sequence, so months compare across years. */
export const monthOrder = ( { year, month }: MonthKey ) => year * MONTHS_IN_YEAR + month;

export const daysInMonth = ( { year, month }: MonthKey ) =>
	new Date( year, month + 1, 0 ).getDate();

const isSameMonth = ( key: MonthKey, other: MonthKey ) =>
	key.year === other.year && key.month === other.month;

export const toMonthKey = ( date: Date ): MonthKey => ( {
	year: date.getFullYear(),
	month: date.getMonth(),
} );

/** Days in the month, from the first day and up to today when either falls inside. */
export function daysCovered( key: MonthKey, today: Date, firstDay?: DayKey ): number {
	const first = firstDay && isSameMonth( key, firstDay ) ? firstDay.day : 1;
	const last = isSameMonth( key, toMonthKey( today ) ) ? today.getDate() : daysInMonth( key );

	// A browser clock behind the server can put the first day after today.
	return Math.max( last - first + 1, 1 );
}

/**
 * Whether a month's figure is short of a whole month, so a total cannot be
 * compared with its neighbors. A per-day figure always can, so nothing is
 * short under the average.
 */
export const isMonthIncomplete = (
	key: MonthKey,
	metric: MonthlyHeatmapMetric,
	today: Date,
	firstDay?: DayKey
) => metric !== 'average' && daysCovered( key, today, firstDay ) < daysInMonth( key );

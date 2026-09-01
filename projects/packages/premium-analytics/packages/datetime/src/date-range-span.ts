/**
 * External dependencies
 */
import {
	addDays,
	addMonths,
	differenceInCalendarDays,
	differenceInCalendarMonths,
	differenceInHours,
	endOfDay,
	isEqual,
	isSameDay,
	startOfDay,
} from 'date-fns';
/**
 * Internal dependencies
 */
import type { DateRange } from './get-comparison-range';

/**
 * The unit a range's length is best described in.
 */
export type DateRangeSpanUnit = 'hour' | 'day' | 'month' | 'year';

/**
 * How long a range is, in the coarsest unit that still divides it evenly.
 */
export type DateRangeSpan = {
	unit: DateRangeSpanUnit;
	value: number;
};

/**
 * Ranges shorter than this are described in hours rather than days.
 */
const MAX_HOURS_SPAN = 48;

/**
 * Below this, a whole-month range still reads better in days: "Last 30 days"
 * should say 30 days, not 1 month.
 */
const MIN_MONTHS_SPAN = 2;

/**
 * Whole-year ranges only collapse into years from this many months up, so a
 * twelve-month window keeps reading as "12 months" the way the design spells
 * it, while a multi-year one does not become an unreadable month count.
 */
const MIN_MONTHS_FOR_YEARS = 24;

const MONTHS_PER_YEAR = 12;

/**
 * Whether the range covers whole calendar days, from the first instant of
 * `from` to the last instant of `to`.
 *
 * @param from - Range start.
 * @param to   - Range end.
 * @return Whether both ends sit on a day boundary.
 */
function coversWholeDays( from: Date, to: Date ): boolean {
	return isEqual( from, startOfDay( from ) ) && isEqual( to, endOfDay( to ) );
}

/**
 * Whole calendar months covered by the range.
 *
 * Counted against the day after `to`, since an inclusive range ends on the last
 * instant of its final day.
 *
 * @param from - Range start.
 * @param to   - Range end.
 * @return The month count, or null when the range is not a whole number of months.
 */
function getWholeMonths( from: Date, to: Date ): number | null {
	// `addDays` keeps the input's `Date` subclass, so a site-timezone `TZDate`
	// stays anchored to that zone rather than the browser's.
	const dayAfterTo = startOfDay( addDays( to, 1 ) );
	const months = differenceInCalendarMonths( dayAfterTo, from );

	if ( months < MIN_MONTHS_SPAN ) {
		return null;
	}

	// `addMonths` clamps a day the target month is too short for (Jan 31 plus one
	// month is Feb 28), so compare the round trip rather than the day-of-month.
	return isSameDay( addMonths( from, months ), dayAfterTo ) ? months : null;
}

/**
 * Measure how long a date range is, in the unit that describes it best.
 *
 * Derived from the range itself rather than the preset that produced it, so a
 * window stepped back from "Last 7 days" still reads as 7 days.
 *
 * A unit is only reported where the range divides evenly into it, so an
 * open-ended range measures by the day it is read on.
 *
 * @param range - The range to measure.
 * @return The span, or null when the range is missing an end.
 */
export function getDateRangeSpan( range?: DateRange ): DateRangeSpan | null {
	const from = range?.from;
	const to = range?.to;

	if ( ! from || ! to ) {
		return null;
	}

	if ( ! coversWholeDays( from, to ) ) {
		// `round`, not the default truncation: an hour-snapped window runs to the
		// last millisecond of its final hour, and truncation reads it an hour short.
		const hours = differenceInHours( to, from, { roundingMethod: 'round' } );

		if ( hours <= MAX_HOURS_SPAN ) {
			return { unit: 'hour', value: Math.max( hours, 1 ) };
		}
	}

	const months = getWholeMonths( from, to );

	if ( months ) {
		if ( months >= MIN_MONTHS_FOR_YEARS && months % MONTHS_PER_YEAR === 0 ) {
			return { unit: 'year', value: months / MONTHS_PER_YEAR };
		}

		return { unit: 'month', value: months };
	}

	const days = differenceInCalendarDays( to, from ) + 1;

	return { unit: 'day', value: Math.max( days, 1 ) };
}

/**
 * External dependencies
 */
import { addDays, addHours, addMonths, addYears, differenceInCalendarDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { getDateRangeSpan, type DateRangeSpanUnit } from './date-range-span';
import type { DateRange } from './get-comparison-range';

/**
 * Which way a step moves the window.
 */
export type StepDirection = 'previous' | 'next';

/**
 * The `date-fns` adder matching each unit a span can be measured in.
 *
 * Calendar adders rather than a millisecond offset: a twelve-month window
 * stepped back has to land on the same days of the month, not 365 days earlier,
 * and a step across a DST boundary has to keep the wall clock rather than the
 * elapsed hours.
 */
const ADD_BY_UNIT: Record< DateRangeSpanUnit, ( date: Date, amount: number ) => Date > = {
	hour: addHours,
	day: addDays,
	month: addMonths,
	year: addYears,
};

/**
 * Move both ends of a range by the same calendar amount.
 *
 * @param from   - Range start.
 * @param to     - Range end.
 * @param unit   - The unit to move in.
 * @param amount - How far, signed.
 * @return The shifted range.
 */
function shift( from: Date, to: Date, unit: DateRangeSpanUnit, amount: number ): DateRange {
	const add = ADD_BY_UNIT[ unit ];

	return { from: add( from, amount ), to: add( to, amount ) };
}

/**
 * Shift a range backward or forward by its own length.
 *
 * The length comes from the range itself, so a window already stepped off its
 * preset keeps stepping by what it actually spans.
 *
 * Calendar units are used where the round trip survives them, which is what
 * keeps a twelve-month window landing on the same days of the month. Where it
 * does not, the step falls back to the day count. `addMonths` clamps a day the
 * target month is too short for and the clamp does not undo: August 31 moved
 * two months back is June 30, and forward again is August 30, a day short of
 * where it started. Reversibility matters more here than the calendar shape,
 * since a window that cannot be stepped back to is one the reader cannot
 * return from.
 *
 * @param range     - The window to move.
 * @param direction - Which way to move it.
 * @return The shifted range, or `undefined` when the range has no measurable span.
 *
 * @example
 * stepDateRange( sevenDays, 'previous' ) // the seven days before it
 * stepDateRange( twelveMonths, 'next' )  // the twelve months after it
 */
export function stepDateRange( range: DateRange, direction: StepDirection ): DateRange | undefined {
	const { from, to } = range;
	const span = getDateRangeSpan( range );

	if ( ! from || ! to || ! span ) {
		return undefined;
	}

	const sign = direction === 'previous' ? -1 : 1;
	const stepped = shift( from, to, span.unit, sign * span.value );
	const returned = shift( stepped.from!, stepped.to!, span.unit, -sign * span.value );

	if ( returned.from!.getTime() === from.getTime() && returned.to!.getTime() === to.getTime() ) {
		return stepped;
	}

	const days = differenceInCalendarDays( to, from ) + 1;

	return shift( from, to, 'day', sign * days );
}

/**
 * Whether a window still reaches the present.
 *
 * What the next control reads: a window ending at or after now has no future to
 * step into, so the control is absent rather than disabled. A live preset is
 * the common case, but a stepped window that lands back on the present answers
 * the same way, which is what makes the control disappear again on the way
 * forward.
 *
 * @param range - The window to test.
 * @param now   - The instant to compare against. Pass the site's, not the browser's.
 * @return Whether the window includes the present.
 */
export function includesPresent( range: DateRange, now: Date ): boolean {
	const to = range.to;

	return !! to && to.getTime() >= now.getTime();
}

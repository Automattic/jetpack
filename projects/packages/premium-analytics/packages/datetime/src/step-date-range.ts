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
 * Calendar adders rather than a millisecond offset: twelve months back has to
 * land on the same days of the month, and a step across a DST boundary has to
 * keep the wall clock.
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
 * Shift a range backward or forward by its own length, measured from the range
 * rather than from the preset that produced it.
 *
 * Falls back to the day count where a calendar step will not undo. `addMonths`
 * clamps a day the target month is too short for: August 31 two months back is
 * June 30, forward again August 30. Reversibility wins over calendar shape,
 * since a window that cannot be stepped back to is one the reader cannot return
 * from.
 *
 * @param range     - The window to move.
 * @param direction - Which way to move it.
 * @return The shifted range, or `undefined` when the range has no measurable span.
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
 * Whether there is a later window to step into.
 *
 * Asks whether the next window exists, not whether this one touches the
 * present. A live preset's `to` is a snapshot of "now" that is stale by the
 * time anything reads it, and `Last 7 days` ends at the end of yesterday, so
 * neither contains the present while both are the latest window available.
 *
 * @param range - The window to test.
 * @param now   - The instant to compare against. Pass the site's, not the browser's.
 * @return Whether a forward step lands on a window that has already happened.
 */
export function canStepForward( range: DateRange, now: Date ): boolean {
	const next = stepDateRange( range, 'next' );

	return !! next?.to && next.to.getTime() <= now.getTime();
}

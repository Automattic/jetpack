/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import {
	addDays,
	addHours,
	addMonths,
	addYears,
	differenceInCalendarDays,
	endOfDay,
	endOfHour,
	endOfMonth,
	endOfYear,
} from 'date-fns';
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
 * June 30, forward again August 30. Reversibility wins over calendar shape.
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
 * End of the bucket an instant sits in, at each granularity a window measures
 * in.
 */
const END_OF_BUCKET: Record< DateRangeSpanUnit, ( date: Date ) => Date > = {
	hour: endOfHour,
	day: endOfDay,
	month: endOfMonth,
	year: endOfYear,
};

/**
 * Whether there is a later window to step into.
 *
 * The next window qualifies once it ends within the bucket `now` sits in, at
 * the window's own granularity. Live presets end at the end of the running
 * hour or day, so the window a reader stepped back from ends in the future;
 * counting the running bucket keeps it reachable, while a window reaching
 * into the next bucket stays out.
 *
 * @param range - The window to test.
 * @param now   - The instant to compare against.
 * @return Whether a forward step lands on a window already worth showing.
 */
export function canStepForward( range: DateRange, now: Date ): boolean {
	const span = getDateRangeSpan( range );
	const next = stepDateRange( range, 'next' );

	if ( ! span || ! next?.to ) {
		return false;
	}

	// Anchored to the window's own timezone, so a site offset from the browser
	// closes its buckets on its own clock.
	const timeZone = range.to && 'timeZone' in range.to ? ( range.to as TZDate ).timeZone : undefined;
	const horizon = END_OF_BUCKET[ span.unit ](
		timeZone ? new TZDate( now.getTime(), timeZone ) : now
	);

	return next.to.getTime() <= horizon.getTime();
}

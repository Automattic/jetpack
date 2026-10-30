/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import {
	addDays,
	addHours,
	addMilliseconds,
	addMonths,
	addYears,
	differenceInCalendarDays,
	endOfDay,
	endOfHour,
	endOfMonth,
	endOfYear,
	subMilliseconds,
} from 'date-fns';
/**
 * Internal dependencies
 */
import { getDateRangeSpan, type DateRangeSpan, type DateRangeSpanUnit } from './date-range-span';
import { getPreviousPeriodMonthCount, type DateRange } from './get-comparison-range';
import {
	PRESET_ALL_TIME,
	PRESET_MONTH_TO_DATE,
	PRESET_YEAR_TO_DATE,
	type PrimaryPresetId,
} from './presets/types';
import { completeToDateRange } from './to-date-range';

/**
 * Which way a step moves the window.
 */
export type StepDirection = 'previous' | 'next';

/**
 * Context a step is taken in.
 */
export type StepOptions = {
	/**
	 * The preset the range came from. A to-date preset steps as its completed
	 * month, and a "Last N days" preset always steps by days.
	 */
	presetId?: PrimaryPresetId;
};

/**
 * Calendar adders rather than a millisecond offset: twelve months back has to
 * land on the same days of the month, and a step across a DST boundary has to
 * keep the wall clock.
 */
type Adder = < T extends Date >( date: T, amount: number ) => T;

const ADD_BY_UNIT: Record< DateRangeSpanUnit, Adder > = {
	hour: addHours,
	day: addDays,
	month: addMonths,
	year: addYears,
};

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
 * The window a step measures: a to-date preset completed to its month or year
 * end, so "This month", "This year" and "12 months" move by whole units rather
 * than the days read so far.
 *
 * @param range    - The window as applied.
 * @param presetId - The preset that produced it.
 * @return The window to step.
 */
function completeForStep< T extends DateRange >( range: T, presetId?: PrimaryPresetId ): T {
	if ( ! range.to ) {
		return range;
	}

	if ( presetId === PRESET_MONTH_TO_DATE ) {
		return { ...range, to: endOfMonth( range.to ) };
	}

	if ( presetId === PRESET_YEAR_TO_DATE ) {
		return { ...range, to: endOfYear( range.to ) };
	}

	return completeToDateRange( range, presetId );
}

/**
 * How far a step moves. Unlike `getDateRangeSpan`, a single whole month counts
 * as a month, so "Last month" steps to the month before rather than 30 days back.
 *
 * @param from     - Window start.
 * @param to       - Window end.
 * @param presetId - The preset the window came from.
 * @return The span, or null when the window cannot be measured.
 */
function getStepSpan( from: TZDate, to: TZDate, presetId?: PrimaryPresetId ): DateRangeSpan | null {
	const months = getPreviousPeriodMonthCount( from, to, presetId );

	return months ? { unit: 'month', value: months } : getDateRangeSpan( { from, to } );
}

/**
 * Move both ends of a range by the same calendar amount.
 *
 * @param from   - Range start.
 * @param to     - Range end.
 * @param unit   - The unit to move in.
 * @param amount - How far, signed.
 * @return The shifted range.
 */
function shift(
	from: TZDate,
	to: TZDate,
	unit: DateRangeSpanUnit,
	amount: number
): Required< DateRange > {
	const add = ADD_BY_UNIT[ unit ];

	if ( unit === 'hour' || unit === 'day' ) {
		return { from: add( from, amount ), to: add( to, amount ) };
	}

	// Moved as an exclusive end: a month end then lands on the next month's end
	// whatever its length, where `addMonths` would keep the day number.
	const end = add( addMilliseconds( to, 1 ), amount );

	return { from: add( from, amount ), to: subMilliseconds( end, 1 ) };
}

/**
 * Shift a range backward or forward by its own length.
 *
 * Falls back to the day count where a calendar step will not undo — `addMonths`
 * clamps a day the target month is too short for, and reversibility wins.
 *
 * @param range     - The window to move.
 * @param direction - Which way to move it.
 * @param options   - The context the window was produced in.
 * @return The shifted range, or `undefined` when the range has no measurable span.
 */
export function stepDateRange(
	range: DateRange,
	direction: StepDirection,
	options: StepOptions = {}
): Required< DateRange > | undefined {
	// All time has no neighbour to step to.
	if ( options.presetId === PRESET_ALL_TIME ) {
		return undefined;
	}

	const { from, to } = completeForStep( range, options.presetId );

	if ( ! from || ! to ) {
		return undefined;
	}

	const span = getStepSpan( from, to, options.presetId );

	if ( ! span ) {
		return undefined;
	}

	const sign = direction === 'previous' ? -1 : 1;
	const stepped = shift( from, to, span.unit, sign * span.value );
	const returned = shift( stepped.from, stepped.to, span.unit, -sign * span.value );

	if ( returned.from.getTime() === from.getTime() && returned.to.getTime() === to.getTime() ) {
		return stepped;
	}

	const days = differenceInCalendarDays( to, from ) + 1;

	return shift( from, to, 'day', sign * days );
}

/**
 * Whether the window is one or more whole calendar years.
 *
 * @param from - Start of the window.
 * @param to   - End of the window.
 * @return Whether the window runs from a January 1st to a December 31st.
 */
function isWholeCalendarYears( from: Date, to: Date ): boolean {
	return (
		from.getMonth() === 0 && from.getDate() === 1 && to.getMonth() === 11 && to.getDate() === 31
	);
}

/**
 * Whether there is a later window to step into.
 *
 * The next window qualifies once it ends within the bucket `now` sits in, so a
 * live preset ending in the running hour or day stays reachable. A calendar
 * year looks ahead to the end of this year, so "Last year" can step into the
 * year to date.
 *
 * @param range   - The window to test.
 * @param now     - The instant to compare against.
 * @param options - The context the window was produced in.
 * @return Whether a forward step lands on a window already worth showing.
 */
export function canStepForward( range: DateRange, now: Date, options: StepOptions = {} ): boolean {
	const { from, to } = completeForStep( range, options.presetId );
	const span = from && to ? getStepSpan( from, to, options.presetId ) : null;
	const next = stepDateRange( range, 'next', options );

	if ( ! span || ! next ) {
		return false;
	}

	// Anchored to the window's own timezone, so a site offset from the browser
	// closes its buckets on its own clock.
	const timeZone = range.to && 'timeZone' in range.to ? ( range.to as TZDate ).timeZone : undefined;
	const unit = isWholeCalendarYears( from as Date, to as Date ) ? 'year' : span.unit;
	const horizon = END_OF_BUCKET[ unit ]( timeZone ? new TZDate( now.getTime(), timeZone ) : now );

	return next.to.getTime() <= horizon.getTime();
}

/**
 * Whether there is an earlier window to step into.
 *
 * @param range                - The window to test.
 * @param options              - The context the window was produced in.
 * @param options.earliestDate - The first instant the plan lets the site read; a
 *                             window starting before it is refused rather than clamped.
 * @return Whether a backward step lands on a readable window.
 */
export function canStepBackward(
	range: DateRange,
	options: StepOptions & { earliestDate?: Date } = {}
): boolean {
	const { earliestDate, ...stepOptions } = options;
	const previous = stepDateRange( range, 'previous', stepOptions );

	if ( ! previous ) {
		return false;
	}

	return ! earliestDate || previous.from.getTime() >= earliestDate.getTime();
}

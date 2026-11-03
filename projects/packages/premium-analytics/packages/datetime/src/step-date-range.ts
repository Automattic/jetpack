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
	differenceInCalendarMonths,
	endOfDay,
	endOfHour,
	endOfMonth,
	endOfYear,
	isFirstDayOfMonth,
	startOfDay,
	subMilliseconds,
} from 'date-fns';
/**
 * Internal dependencies
 */
import { getDateRangeSpan, type DateRangeSpan, type DateRangeSpanUnit } from './date-range-span';
import { getPreviousPeriodMonthCount, type DateRange } from './get-comparison-range';
import {
	PRESET_ALL_TIME,
	PRESET_CUSTOM,
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
	 * month or year, and a "Last N days" preset always steps by days.
	 */
	presetId?: PrimaryPresetId;

	/**
	 * The current instant on the window's clock. A hand-picked window running
	 * from a month's first day to the end of today then steps as its completed
	 * months, like the month to date.
	 */
	now?: TZDate;

	/**
	 * The span the window was reached by, when it landed from a step. It steps
	 * by that again rather than by its own shape, so Previous undoes Next.
	 */
	span?: DateRangeSpan;
};

/**
 * A window measured for stepping: completed where it is still running, and
 * the span it moves by.
 */
export type MeasuredStep = Required< DateRange > & { span: DateRangeSpan };

const MONTHS_PER_YEAR = 12;

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

const END_OF_BUCKET: Record< DateRangeSpanUnit, ( date: TZDate ) => TZDate > = {
	hour: endOfHour,
	day: endOfDay,
	month: endOfMonth,
	year: endOfYear,
};

/**
 * End of the bucket an instant sits in, at the granularity a window steps in.
 * The next window qualifies once it ends within this bucket, so a live preset
 * ending in the running hour, day, month or year stays reachable.
 *
 * @param now  - The instant, on the window's clock.
 * @param unit - The unit the window steps in.
 * @return The last instant of that bucket.
 */
export function endOfStepBucket( now: TZDate, unit: DateRangeSpanUnit ): TZDate {
	return END_OF_BUCKET[ unit ]( now );
}

/**
 * Whether a hand-picked window runs from a month's first day to the end of
 * today and spans more than that month, so that it reads as months to date,
 * or as the year to date from January's.
 *
 * @param range - The window.
 * @param now   - The current instant, on the window's clock.
 * @return Whether the window is a to-date run of months.
 */
function isMonthsToDate( range: Required< DateRange >, now: TZDate ): boolean {
	const { from, to } = range;

	return (
		isFirstDayOfMonth( from ) &&
		from.getTime() === startOfDay( from ).getTime() &&
		to.getTime() === endOfDay( now ).getTime() &&
		differenceInCalendarMonths( to, from ) >= 1
	);
}

/**
 * The window a step measures: a to-date window completed to its month or year
 * end, so "This month", "This year", "12 months" and a hand-picked run of
 * months to date move by whole units rather than the days read so far.
 *
 * @param range   - The window as applied.
 * @param options - The context it was produced in.
 * @return The window to step.
 */
function completeForStep(
	range: Required< DateRange >,
	options: StepOptions
): Required< DateRange > {
	const { presetId, now, span } = options;

	// A month or year step lands on a month or year end unless it was pulled
	// back to today; pushed out again, the reverse step undoes it.
	if ( span ) {
		return span.unit === 'month' || span.unit === 'year'
			? { ...range, to: END_OF_BUCKET[ span.unit ]( range.to ) }
			: range;
	}

	if ( presetId === PRESET_MONTH_TO_DATE ) {
		return { ...range, to: endOfMonth( range.to ) };
	}

	if ( presetId === PRESET_YEAR_TO_DATE ) {
		return { ...range, to: endOfYear( range.to ) };
	}

	if (
		( presetId === undefined || presetId === PRESET_CUSTOM ) &&
		now &&
		isMonthsToDate( range, now )
	) {
		return {
			...range,
			to: range.from.getMonth() === 0 ? endOfYear( range.to ) : endOfMonth( range.to ),
		};
	}

	return completeToDateRange( range, presetId );
}

/**
 * How far a step moves, measured the way the comparison measures its previous
 * period: whole calendar months as months (whole calendar years as years, so
 * "Last year" looks ahead to the end of this one), any other day-aligned
 * window by its days. `getDateRangeSpan` is for labels, so it would read a
 * window starting mid-month as months and a single whole month as days.
 *
 * @param from     - Window start.
 * @param to       - Window end.
 * @param presetId - The preset the window came from.
 * @return The span, or null when the window cannot be measured.
 */
function getStepSpan( from: TZDate, to: TZDate, presetId?: PrimaryPresetId ): DateRangeSpan | null {
	const months = getPreviousPeriodMonthCount( from, to, presetId );

	if ( months ) {
		return from.getMonth() === 0 && months % MONTHS_PER_YEAR === 0
			? { unit: 'year', value: months / MONTHS_PER_YEAR }
			: { unit: 'month', value: months };
	}

	const span = getDateRangeSpan( { from, to } );

	if ( ! span || span.unit === 'hour' ) {
		return span;
	}

	return { unit: 'day', value: differenceInCalendarDays( to, from ) + 1 };
}

/**
 * Measure a window for stepping. Both ends must sit on the window's own
 * clock, so that day and month boundaries are cut on the site's calendar.
 *
 * @param range   - The window to move, both ends present.
 * @param options - The context the window was produced in.
 * @return The completed window and its span, or null when it cannot step: "All
 *   time" has no neighbour, and a backwards range has no length.
 */
export function measureStep(
	range: Required< DateRange >,
	options: StepOptions = {}
): MeasuredStep | null {
	if ( options.presetId === PRESET_ALL_TIME ) {
		return null;
	}

	const { from, to } = completeForStep( range, options );
	const span = options.span ?? getStepSpan( from, to, options.presetId );

	return span ? { from, to, span } : null;
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
 * Shift a measured window backward or forward by its span.
 *
 * Falls back to the day count where a calendar step will not undo — `addMonths`
 * clamps a day the target month is too short for, and reversibility wins.
 *
 * @param step      - The measured window.
 * @param direction - Which way to move it.
 * @return The shifted range, with the span it was moved by.
 */
export function shiftStep( step: MeasuredStep, direction: StepDirection ): MeasuredStep {
	const { from, to, span } = step;
	const sign = direction === 'previous' ? -1 : 1;
	const stepped = shift( from, to, span.unit, sign * span.value );
	const returned = shift( stepped.from, stepped.to, span.unit, -sign * span.value );

	if ( returned.from.getTime() === from.getTime() && returned.to.getTime() === to.getTime() ) {
		return { ...stepped, span };
	}

	const days = { unit: 'day', value: differenceInCalendarDays( to, from ) + 1 } as const;

	return { ...shift( from, to, days.unit, sign * days.value ), span: days };
}

/**
 * Shift a range backward or forward by its own length.
 *
 * @param range     - The window to move, both ends on its own clock.
 * @param direction - Which way to move it.
 * @param options   - The context the window was produced in.
 * @return The shifted range, or `undefined` when the range cannot step.
 */
export function stepDateRange(
	range: Required< DateRange >,
	direction: StepDirection,
	options: StepOptions = {}
): Required< DateRange > | undefined {
	const measured = measureStep( range, options );

	if ( ! measured ) {
		return undefined;
	}

	const { from, to } = shiftStep( measured, direction );

	return { from, to };
}

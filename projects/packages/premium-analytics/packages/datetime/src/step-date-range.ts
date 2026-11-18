/**
 * External dependencies
 */
import {
	addDays,
	addMilliseconds,
	addMonths,
	addYears,
	differenceInCalendarDays,
	differenceInCalendarMonths,
	differenceInHours,
	endOfDay,
	endOfHour,
	endOfMonth,
	endOfYear,
	isFirstDayOfMonth,
	isLastDayOfMonth,
	startOfDay,
	startOfMonth,
	startOfYear,
	subMilliseconds,
} from 'date-fns';
/**
 * Internal dependencies
 */
import {
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_24_HOURS,
	PRESET_LAST_3_YEARS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_LAST_7_DAYS,
	PRESET_LAST_90_DAYS,
	PRESET_LAST_MONTH,
	PRESET_LAST_YEAR,
	PRESET_MONTH_TO_DATE,
	PRESET_TODAY,
	PRESET_YEAR_TO_DATE,
	PRESET_YESTERDAY,
	isSelectablePreset,
	type SelectablePresetId,
} from './presets/types';
import type { DateRangeSpan, DateRangeSpanUnit } from './date-range-span';
import type { DateRange } from './get-comparison-range';
import type { IntervalType } from './interval';
import type { TZDate } from '@date-fns/tz';

/**
 * Which way a step moves the window.
 */
export type StepDirection = 'previous' | 'next';

/**
 * A length in whole hours, days, months or years, written as an ISO 8601 duration.
 */
export type DateStepDuration =
	`P${ number }D` | `P${ number }M` | `P${ number }Y` | `PT${ number }H`;

/**
 * How a window steps, as the URL carries it: the preset the window was stepped
 * from, which moves by that preset's own unit, or the shape a hand-picked
 * window was measured as on its first step.
 */
export type DateStepId = SelectablePresetId | DateStepDuration;

const MONTHS_PER_YEAR = 12;
const MS_PER_HOUR = 60 * 60 * 1000;

const PRESET_STEP_SPANS: Record< SelectablePresetId, DateRangeSpan > = {
	[ PRESET_TODAY ]: { unit: 'day', value: 1 },
	[ PRESET_YESTERDAY ]: { unit: 'day', value: 1 },
	[ PRESET_LAST_24_HOURS ]: { unit: 'hour', value: 24 },
	[ PRESET_LAST_7_DAYS ]: { unit: 'day', value: 7 },
	[ PRESET_LAST_30_DAYS ]: { unit: 'day', value: 30 },
	[ PRESET_LAST_90_DAYS ]: { unit: 'day', value: 90 },
	[ PRESET_LAST_365_DAYS ]: { unit: 'day', value: 365 },
	[ PRESET_MONTH_TO_DATE ]: { unit: 'month', value: 1 },
	[ PRESET_LAST_MONTH ]: { unit: 'month', value: 1 },
	[ PRESET_YEAR_TO_DATE ]: { unit: 'year', value: 1 },
	[ PRESET_LAST_12_MONTHS ]: { unit: 'month', value: 12 },
	[ PRESET_LAST_YEAR ]: { unit: 'year', value: 1 },
	[ PRESET_LAST_3_YEARS ]: { unit: 'year', value: 3 },
};

const DURATION_PATTERN = /^P(?:T(\d+)H|(\d+)D|(\d+)M|(\d+)Y)$/;

/**
 * The longest step a URL may name, in each unit: a century, so a hand-edited
 * value cannot carry the window past the dates a `Date` can hold.
 */
const MAX_STEP_VALUES: Record< DateRangeSpanUnit, number > = {
	hour: 100 * 366 * 24,
	day: 100 * 366,
	month: 100 * 12,
	year: 100,
};

/**
 * The step a URL value names, or `undefined` for anything else, so a
 * hand-edited value cannot move the window by nothing or by a century and more.
 *
 * @param value - The `step` search value.
 * @return The step id.
 */
export function parseDateStepId( value: unknown ): DateStepId | undefined {
	if ( isSelectablePreset( value ) ) {
		return value;
	}

	const span = typeof value === 'string' ? parseDuration( value ) : undefined;

	return span && span.value > 0 && span.value <= MAX_STEP_VALUES[ span.unit ]
		? ( value as DateStepDuration )
		: undefined;
}

/**
 * Read a duration, or `undefined` when the value is not one.
 *
 * @param value - The duration.
 * @return The span.
 */
function parseDuration( value: string ): DateRangeSpan | undefined {
	const [ , hours, days, months, years ] = DURATION_PATTERN.exec( value ) ?? [];

	if ( hours ) {
		return { unit: 'hour', value: Number( hours ) };
	}
	if ( days ) {
		return { unit: 'day', value: Number( days ) };
	}
	if ( months ) {
		return { unit: 'month', value: Number( months ) };
	}
	if ( years ) {
		return { unit: 'year', value: Number( years ) };
	}

	return undefined;
}

/**
 * How far a step moves.
 *
 * @param stepId - The step id.
 * @return The span.
 */
export function getStepSpan( stepId: DateStepId ): DateRangeSpan {
	return isSelectablePreset( stepId )
		? PRESET_STEP_SPANS[ stepId ]
		: ( parseDuration( stepId ) as DateRangeSpan );
}

/**
 * The step a chart bucket opened as the period moves by: its own unit, so Previous from
 * today's bar is the whole of yesterday however little of today has passed.
 *
 * @param interval - The interval the bucket was drawn in.
 * @return The step id, or `undefined` for an interval whose buckets do not open.
 */
export function bucketStepId( interval: IntervalType ): DateStepDuration | undefined {
	switch ( interval ) {
		case 'day':
			return 'P1D';
		case 'week':
			return 'P7D';
		case 'month':
			return 'P1M';
		case 'quarter':
			return 'P3M';
		case 'year':
			return 'P1Y';
		default:
			return undefined;
	}
}

/**
 * The step a hand-picked window moves by, measured once from its shape: whole
 * calendar months (whole calendar years, from a January) step by months, any
 * other run of whole days by its days, anything else by its hours.
 *
 * @param range - The window, both ends on its own clock.
 * @return The step id, or `undefined` when the window runs backwards.
 */
export function measureStepId( range: Required< DateRange > ): DateStepId | undefined {
	const { from, to } = range;

	if ( to.getTime() < from.getTime() ) {
		return undefined;
	}

	const isWholeDays =
		from.getTime() === startOfDay( from ).getTime() && to.getTime() === endOfDay( to ).getTime();

	if ( ! isWholeDays ) {
		// `round`, not the default truncation: an hour-snapped window runs to the
		// last millisecond of its final hour, and truncation reads it an hour short.
		const hours = differenceInHours( to, from, { roundingMethod: 'round' } );

		return `PT${ Math.max( hours, 1 ) }H`;
	}

	if ( isFirstDayOfMonth( from ) && isLastDayOfMonth( to ) ) {
		const months = differenceInCalendarMonths( to, from ) + 1;

		return from.getMonth() === 0 && months % MONTHS_PER_YEAR === 0
			? `P${ months / MONTHS_PER_YEAR }Y`
			: `P${ months }M`;
	}

	return `P${ differenceInCalendarDays( to, from ) + 1 }D`;
}

/**
 * Move a window one step along and rebuild both ends on the calendar: the
 * start moves by the span, and the end closes the last unit from there, so a
 * window whose end was cut at today comes back whole when it steps away.
 * Hours move by elapsed time, so a window crossing a DST change keeps its length.
 *
 * @param range     - The window, both ends on its own clock.
 * @param span      - How far to move it.
 * @param direction - Which way.
 * @return The window one step along.
 */
export function shiftStep(
	range: Required< DateRange >,
	span: DateRangeSpan,
	direction: StepDirection
): Required< DateRange > {
	const amount = direction === 'previous' ? -span.value : span.value;
	const { from } = range;

	// One date-fns call per statement: a nested one has no contextual type, and widens to `Date`.
	switch ( span.unit ) {
		case 'hour': {
			const start = addMilliseconds( from, amount * MS_PER_HOUR );
			const end = addMilliseconds( start, span.value * MS_PER_HOUR );

			return { from: start, to: subMilliseconds( end, 1 ) };
		}
		case 'day': {
			const moved = addDays( from, amount );
			const start = startOfDay( moved );
			const last = addDays( start, span.value - 1 );

			return { from: start, to: endOfDay( last ) };
		}
		case 'month': {
			const moved = addMonths( from, amount );
			const start = startOfMonth( moved );
			const last = addMonths( start, span.value - 1 );

			return { from: start, to: endOfMonth( last ) };
		}
		case 'year': {
			const moved = addYears( from, amount );
			const start = startOfYear( moved );
			const last = addYears( start, span.value - 1 );

			return { from: start, to: endOfYear( last ) };
		}
	}
}

/**
 * The last instant a window may show: the end of today, or of the running
 * hour for a window stepping by hours.
 *
 * @param now  - The current instant, on the window's clock.
 * @param unit - The unit the window steps in.
 * @return The cut-off.
 */
export function endOfStepHorizon( now: TZDate, unit: DateRangeSpanUnit ): TZDate {
	return unit === 'hour' ? endOfHour( now ) : endOfDay( now );
}

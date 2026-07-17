/**
 * External dependencies
 */
import {
	differenceInDays,
	differenceInMilliseconds,
	subDays,
	subMilliseconds,
	subWeeks,
	subMonths,
	subYears,
	startOfDay,
	endOfDay,
} from 'date-fns';

/**
 * Supported comparison preset identifiers.
 */
export type DateRange = { from?: Date; to?: Date };

/**
 * Named constants for comparison preset identifiers.
 */
export const COMPARISON_PREVIOUS_PERIOD = 'previous-period' as const;
export const COMPARISON_PREVIOUS_WEEK = 'previous-week' as const;
export const COMPARISON_PREVIOUS_MONTH = 'previous-month' as const;
export const COMPARISON_PREVIOUS_YEAR = 'previous-year' as const;

/**
 * All comparison preset identifiers, in display order.
 */
export const COMPARISON_PRESETS = [
	COMPARISON_PREVIOUS_PERIOD,
	COMPARISON_PREVIOUS_WEEK,
	COMPARISON_PREVIOUS_MONTH,
	COMPARISON_PREVIOUS_YEAR,
] as const;

export type ComparisonPresetId = ( typeof COMPARISON_PRESETS )[ number ];

/**
 * Type guard to check if a string is a valid ComparisonPresetId.
 *
 * @param value - The value to check.
 * @return True if the value is a valid ComparisonPresetId, false otherwise.
 */
export function isComparisonPresetId( value: unknown ): value is ComparisonPresetId {
	return typeof value === 'string' && ( COMPARISON_PRESETS as readonly string[] ).includes( value );
}

/**
 * Returns a comparison DateRange (as Date objects) derived from a reference range
 * and a given preset.
 *
 * - This function is pure and has no side effects.
 * - It does not apply any timezone adjustments; day boundaries are resolved in
 *   the frame of the incoming dates (pass TZDate instances for site-local math).
 * - Day-aligned references (midnight to end of day) produce day-aligned
 *   comparison ranges. Sub-day references (rolling windows like the last 24
 *   hours) mirror the exact window instead, so the comparison always covers
 *   the same amount of time as the primary range.
 *
 * @param reference - The reference range to compare against (must include both `from` and `to`).
 * @param presetId  - One of the supported preset identifiers.
 * @return A new DateRange for the comparison period, or `undefined` if inputs are invalid.
 */
export function getComparisonRangeFromPreset(
	reference: DateRange,
	presetId: ComparisonPresetId
): DateRange | undefined {
	if ( ! reference?.from || ! reference?.to ) {
		return undefined;
	}

	const refFrom = reference.from;
	const refTo = reference.to;

	const isDayAligned =
		refFrom.getTime() === startOfDay( refFrom ).getTime() &&
		refTo.getTime() === endOfDay( refTo ).getTime();

	// Sub-day windows shift only their end, then rebuild `from` from the
	// original duration: calendar shifts clamp day-of-month (Mar 31 - 1 month
	// = Feb 28) and would otherwise shrink or collapse the window.
	if ( ! isDayAligned ) {
		const windowMs = differenceInMilliseconds( refTo, refFrom );
		let to: Date;

		if ( presetId === COMPARISON_PREVIOUS_PERIOD ) {
			to = subMilliseconds( refTo, windowMs );
		} else if ( presetId === COMPARISON_PREVIOUS_WEEK ) {
			to = subWeeks( refTo, 1 );
		} else if ( presetId === COMPARISON_PREVIOUS_MONTH ) {
			to = subMonths( refTo, 1 );
		} else if ( presetId === COMPARISON_PREVIOUS_YEAR ) {
			to = subYears( refTo, 1 );
		} else {
			return undefined;
		}

		return {
			from: subMilliseconds( to, windowMs ),
			to,
		};
	}

	const clampDayBound = ( date: Date, bound: 0 | 1 ) =>
		bound === 1 ? endOfDay( startOfDay( date ) ) : startOfDay( date );

	if ( presetId === COMPARISON_PREVIOUS_PERIOD ) {
		const daysInclusive = differenceInDays( refTo, refFrom ) + 1;
		return {
			from: clampDayBound( subDays( refFrom, daysInclusive ), 0 ),
			to: clampDayBound( subDays( refTo, daysInclusive ), 1 ),
		};
	}

	if ( presetId === COMPARISON_PREVIOUS_WEEK ) {
		return {
			from: clampDayBound( subWeeks( refFrom, 1 ), 0 ),
			to: clampDayBound( subWeeks( refTo, 1 ), 1 ),
		};
	}

	if ( presetId === COMPARISON_PREVIOUS_MONTH ) {
		return {
			from: clampDayBound( subMonths( refFrom, 1 ), 0 ),
			to: clampDayBound( subMonths( refTo, 1 ), 1 ),
		};
	}

	if ( presetId === COMPARISON_PREVIOUS_YEAR ) {
		return {
			from: clampDayBound( subYears( refFrom, 1 ), 0 ),
			to: clampDayBound( subYears( refTo, 1 ), 1 ),
		};
	}

	return undefined;
}

/**
 * External dependencies
 */
import {
	differenceInDays,
	differenceInMilliseconds,
	endOfDay,
	endOfMonth,
	isFirstDayOfMonth,
	isLastDayOfMonth,
	startOfDay,
	startOfMonth,
	subDays,
	subMilliseconds,
	subMonths,
	subYears,
} from 'date-fns';

export type DateRange = { from?: Date; to?: Date };

export const COMPARISON_PREVIOUS_PERIOD = 'previous-period' as const;
export const COMPARISON_PREVIOUS_MONTH = 'previous-month' as const;
export const COMPARISON_PREVIOUS_YEAR = 'previous-year' as const;

/**
 * All comparison preset identifiers, in display order.
 */
export const COMPARISON_PRESETS = [
	COMPARISON_PREVIOUS_PERIOD,
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
 * Count the calendar days in an inclusive range.
 *
 * @param from - Range start.
 * @param to   - Range end.
 * @return The inclusive day count.
 */
function getInclusiveDayCount( from: Date, to: Date ): number {
	return differenceInDays( to, from ) + 1;
}

/**
 * Returns a comparison DateRange derived from a reference range and a preset.
 *
 * - Day boundaries are resolved in the frame of the incoming dates; pass TZDate
 *   instances for site-local math.
 * - Whole months are detected from the range shape alone, so a rolling window
 *   that happens to land on one also compares calendar-to-calendar.
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

	// Sub-day windows shift only their end, then rebuild `from` from the original
	// duration: a calendar shift clamps day-of-month and would collapse the window.
	if ( ! isDayAligned ) {
		const windowMs = differenceInMilliseconds( refTo, refFrom );
		let to: Date;

		if ( presetId === COMPARISON_PREVIOUS_PERIOD ) {
			// Both ends are inclusive, so the window lasts `windowMs + 1`; shifting
			// by `windowMs` alone lands `to` inside the reference window.
			to = subMilliseconds( refTo, windowMs + 1 );
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
		const daysInclusive = getInclusiveDayCount( refFrom, refTo );
		return {
			from: clampDayBound( subDays( refFrom, daysInclusive ), 0 ),
			to: clampDayBound( subDays( refTo, daysInclusive ), 1 ),
		};
	}

	if ( presetId === COMPARISON_PREVIOUS_MONTH || presetId === COMPARISON_PREVIOUS_YEAR ) {
		const shiftBack = presetId === COMPARISON_PREVIOUS_MONTH ? subMonths : subYears;

		// Keep whole-month comparisons aligned to calendar boundaries.
		if ( isFirstDayOfMonth( refFrom ) && isLastDayOfMonth( refTo ) ) {
			return {
				from: clampDayBound( startOfMonth( shiftBack( refFrom, 1 ) ), 0 ),
				to: clampDayBound( endOfMonth( shiftBack( refTo, 1 ) ), 1 ),
			};
		}

		// Anchor the end, then rebuild the start to preserve the day count. If the
		// calendar shift clamps the end (Mar 31 to Feb 28), the start may move into January.
		const to = shiftBack( refTo, 1 );
		const daysInclusive = getInclusiveDayCount( refFrom, refTo );

		return {
			from: clampDayBound( subDays( to, daysInclusive - 1 ), 0 ),
			to: clampDayBound( to, 1 ),
		};
	}

	return undefined;
}

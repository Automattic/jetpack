/**
 * External dependencies
 */
import {
	differenceInDays,
	differenceInMilliseconds,
	isFirstDayOfMonth,
	isLastDayOfMonth,
	subDays,
	subMilliseconds,
	subMonths,
	subYears,
	startOfDay,
	startOfMonth,
	endOfDay,
	endOfMonth,
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
 * Returns a comparison DateRange (as Date objects) derived from a reference range
 * and a given preset.
 *
 * - This function is pure and has no side effects.
 * - It does not apply any timezone adjustments; day boundaries are resolved in
 *   the frame of the incoming dates (pass TZDate instances for site-local math).
 * - Day-aligned references (midnight to end of day) produce day-aligned
 *   comparison ranges. Sub-day references (rolling windows like the last 24
 *   hours) mirror the exact window instead.
 * - The comparison covers the same amount of time as the reference, except
 *   where the reference covers whole calendar months: `previous-month` and
 *   `previous-year` then shift the calendar and keep both ends on the month.
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
			// Both ends are inclusive, so the window lasts `windowMs + 1`. Shifting
			// by `windowMs` alone lands `to` on `refFrom` itself, inside the
			// reference window, which reads one bucket late at hourly granularity.
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
		const daysInclusive = differenceInDays( refTo, refFrom ) + 1;
		return {
			from: clampDayBound( subDays( refFrom, daysInclusive ), 0 ),
			to: clampDayBound( subDays( refTo, daysInclusive ), 1 ),
		};
	}

	if ( presetId === COMPARISON_PREVIOUS_MONTH || presetId === COMPARISON_PREVIOUS_YEAR ) {
		const shiftBack = presetId === COMPARISON_PREVIOUS_MONTH ? subMonths : subYears;

		// A whole-month reference keeps the calendar shift, because unequal
		// lengths are the point there: March against February is 31 days
		// against 28. Both ends re-snap to the month, which also repairs the
		// shift's day-of-month clamp — January 1 through February 28 shifted a
		// month back ends on January 28, mid-month.
		if ( isFirstDayOfMonth( refFrom ) && isLastDayOfMonth( refTo ) ) {
			return {
				from: clampDayBound( startOfMonth( shiftBack( refFrom, 1 ) ), 0 ),
				to: clampDayBound( endOfMonth( shiftBack( refTo, 1 ) ), 1 ),
			};
		}

		/*
		 * Every other window keeps its length. Shifting each end on its own
		 * lets month lengths resize it — July 21 - August 19 (30 days) landed
		 * on June 21 - July 19 (29) — and the widgets divide raw totals, with
		 * no per-day normalization, so a missing day biases every delta.
		 * The end is the anchor, as in the sub-day branch above: the comparison
		 * then ends exactly the named interval before the reference does, which
		 * is the endpoint the label promises.
		 */
		const to = shiftBack( refTo, 1 );
		const daysInclusive = differenceInDays( refTo, refFrom ) + 1;

		return {
			from: clampDayBound( subDays( to, daysInclusive - 1 ), 0 ),
			to: clampDayBound( to, 1 ),
		};
	}

	return undefined;
}

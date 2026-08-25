/**
 * External dependencies
 */
import type { DateRangeSpan } from '@jetpack-premium-analytics/datetime';

/**
 * Hours in a day, the longest rolling window still named by a single date.
 */
const HOURS_IN_DAY = 24;

/**
 * Whether a span is short enough to be named by the day it ends on.
 *
 * @param span - The measured span.
 * @return Whether one date describes the span.
 */
export function isSingleDaySpan( span: DateRangeSpan | null ): boolean {
	if ( ! span ) {
		return false;
	}

	return (
		( span.unit === 'day' && span.value === 1 ) ||
		( span.unit === 'hour' && span.value <= HOURS_IN_DAY )
	);
}

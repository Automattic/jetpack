/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { formatDate } from './format-date';
import { getDateRangeSpan, type DateRangeSpan } from './get-date-range-span';
import type { DateRange } from './types';

type FormatDateRangeLongOptions = {
	/**
	 * Year treated as current, against which the year is considered redundant.
	 * Defaults to the year of the current date.
	 */
	referenceYear?: number;

	/**
	 * Render the calendar shape (no weekday, always the year) whatever the
	 * range measures.
	 *
	 * For selections whose scale is a property of the selection rather than of
	 * the dates. A calendar year still running ends at the end of today, so its
	 * measured unit, and with it the shape, would otherwise change by the day.
	 */
	calendarScale?: boolean;
};

/**
 * Hours in a day, the longest window still named by a single date.
 */
const HOURS_IN_DAY = 24;

/**
 * Join two formatted endpoints into a range.
 *
 * Translatable rather than a hardcoded en dash, and sharing the msgid with
 * `formatDateRange`, so a locale that spaces or marks its ranges differently
 * only has to say so once.
 *
 * @param from - The formatted start.
 * @param to   - The formatted end.
 * @return The joined range.
 */
function joinRange( from: string, to: string ): string {
	return sprintf(
		// translators: %1$s is the start of a date range, %2$s is the end.
		__( '%1$s – %2$s', 'jetpack-premium-analytics-pkg' ),
		from,
		to
	);
}

/**
 * The calendar year a date falls in, read in the site's timezone.
 *
 * `Date.getFullYear()` reads the browser's instead, which disagrees with every
 * other date in this file around New Year for anyone offset from the site.
 *
 * @param date - The instant to read.
 * @return The four-digit year.
 */
function getSiteYear( date: Date | number ): number {
	return Number( formatDate( date, 'year' ) );
}

/**
 * Whether the range covers at most a day's worth of time, and so is named by
 * the day it falls on rather than by two endpoints.
 *
 * Covers both shapes a single day takes: a day-aligned one, whose endpoints
 * would otherwise repeat the same date, and a rolling 24-hour window, which
 * straddles two calendar days without being about either of them in full.
 *
 * @param span - The measured span.
 * @return Whether one date describes the range.
 */
function isSingleDay( span: DateRangeSpan | null ): boolean {
	if ( ! span ) {
		return false;
	}

	return (
		( span.unit === 'day' && span.value === 1 ) ||
		( span.unit === 'hour' && span.value <= HOURS_IN_DAY )
	);
}

/**
 * Format a date range in the explicit, readable form the section header
 * subtitle uses.
 *
 * The shape follows the range's own length. Day-scale ranges lead with the
 * weekday, which is what makes a rolling window legible at a glance; longer
 * ranges drop it as noise and always carry the year, since they routinely span
 * two. The year is added to day-scale ranges only when they fall outside the
 * reference year, so stepping back through past periods stays unambiguous
 * without repeating the current year on every render.
 *
 * A window of a day or less is named by a single date instead of a range.
 *
 * @example
 * formatDateRangeLong( { from, to } ) // 7 days:      'Tuesday, July 21 – Monday, July 27'
 *                                     // past year:   'Tuesday, July 16, 2024 – Monday, July 22, 2024'
 *                                     // 12 months:   'July 1, 2025 – June 30, 2026'
 *                                     // 24 hours:    'Tuesday, July 28'
 *
 * @param range     - The range to format.
 * @param [options] - Formatting options.
 * @return The formatted range, or `''` when `range`, `from`, or `to` is missing.
 */
export const formatDateRangeLong = (
	range?: DateRange,
	options: FormatDateRangeLongOptions = {}
): string => {
	const from = range?.from;
	const to = range?.to;

	if ( ! from || ! to ) {
		return '';
	}

	const span = getDateRangeSpan( { from, to } );

	if ( options.calendarScale || span?.unit === 'month' || span?.unit === 'year' ) {
		return joinRange( formatDate( from, 'medium' ), formatDate( to, 'medium' ) );
	}

	const referenceYear = options.referenceYear ?? getSiteYear( Date.now() );
	const inReferenceYear =
		getSiteYear( from ) === referenceYear && getSiteYear( to ) === referenceYear;
	const pattern = inReferenceYear ? 'fullNoYear' : 'full';

	if ( isSingleDay( span ) ) {
		return formatDate( from, pattern );
	}

	return joinRange( formatDate( from, pattern ), formatDate( to, pattern ) );
};

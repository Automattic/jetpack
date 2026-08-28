/**
 * External dependencies
 */
import {
	getDateRangeSpan,
	type DateRange,
	type DateRangeSpan,
} from '@jetpack-premium-analytics/datetime';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { formatDate, type DateFormatName } from './format-date';
import { isSingleDaySpan } from './is-single-day-span';

type FormatDateRangeLongOptions = {
	/**
	 * Year treated as current, against which the year is considered redundant.
	 * Defaults to the year of the current date.
	 */
	referenceYear?: number;

	/**
	 * Render the calendar shape (no weekday, always the year) whatever the range
	 * measures — a calendar year still running would otherwise change shape by
	 * the day.
	 */
	calendarScale?: boolean;
};

/**
 * The longest window whose weekdays are worth naming.
 */
const MAX_WEEKDAY_SPAN_DAYS = 7;

/**
 * Whether the range is short enough for its weekdays to say something.
 *
 * Over a week's worth of days, they describe where the window happens to fall
 * rather than what it covers, and cost the reader two words before either date.
 *
 * @param span - The measured span.
 * @return Whether to lead each end with its weekday.
 */
function namesWeekday( span: DateRangeSpan | null ): boolean {
	if ( ! span ) {
		return false;
	}

	return span.unit === 'hour' || ( span.unit === 'day' && span.value <= MAX_WEEKDAY_SPAN_DAYS );
}

/**
 * The named format for a shape.
 *
 * @param withWeekday - Whether each end leads with its weekday.
 * @param withYear    - Whether each end carries the year.
 * @return The named format to render both ends in.
 */
function datePattern( withWeekday: boolean, withYear: boolean ): DateFormatName {
	if ( withWeekday ) {
		return withYear ? 'full' : 'fullNoYear';
	}

	return withYear ? 'medium' : 'short';
}

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
 * Format a date range in the explicit form the section header subtitle uses.
 *
 * The shape follows the range's own length: a week or less leads each end with
 * its weekday, the year is carried only outside the reference year, and a day
 * or less is named by a single date.
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
	const referenceYear = options.referenceYear ?? getSiteYear( Date.now() );
	const inReferenceYear =
		getSiteYear( from ) === referenceYear && getSiteYear( to ) === referenceYear;

	const pattern = datePattern(
		! options.calendarScale && namesWeekday( span ),
		options.calendarScale || ! inReferenceYear
	);

	if ( isSingleDaySpan( span ) ) {
		// `to`: the same day for a day-aligned window; for a rolling one, the
		// day the reading is taken on.
		return formatDate( to, pattern );
	}

	return joinRange( formatDate( from, pattern ), formatDate( to, pattern ) );
};

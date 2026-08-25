/**
 * External dependencies
 */
import { getDateRangeSpan, type DateRange } from '@jetpack-premium-analytics/datetime';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { elideRange, type RangeFormatName } from './elide-range';
import { formatDate } from './format-date';
import { isSingleDaySpan } from './is-single-day-span';

type FormatDateRangeOptions = {
	/**
	 * Name a window of a day or less by the day it ends on, even when a rolling
	 * window crosses a calendar boundary.
	 */
	collapseSingleDay?: boolean;
};

/**
 * Format a date range in one of the forms `elideRange` can elide.
 *
 * @param name      - The form to render in.
 * @param range     - The range to format.
 * @param [options] - Formatting options.
 * @return The formatted range.
 */
const formatRange = (
	name: RangeFormatName,
	range?: DateRange,
	options: FormatDateRangeOptions = {}
): string => {
	const { from, to } = range ?? {};

	if ( ! from || ! to ) {
		return '';
	}

	if ( options.collapseSingleDay && isSingleDaySpan( getDateRangeSpan( { from, to } ) ) ) {
		return formatDate( to, name );
	}

	// Compare complete site-local dates because the display format may omit the year.
	if ( formatDate( from, 'iso' ) === formatDate( to, 'iso' ) ) {
		return formatDate( from, name );
	}

	return (
		elideRange( from, to, name ) ??
		sprintf(
			/* translators: 1: Start date. 2: End date. */
			__( '%1$s – %2$s', 'jetpack-premium-analytics-pkg' ),
			formatDate( from, name ),
			formatDate( to, name )
		)
	);
};

/**
 * Format a date range into a human-readable string.
 *
 * A shared month or year is elided where the site's locale has a rule for it —
 * see `elideRange`, which borrows those rules from CLDR rather than inventing
 * them. Eliding by hand is not an option: "Jun 21-25, 2025" is an English
 * typographic convention that, applied to a Spanish site, yields
 * "21 de junio-25 de junio de 2025". Where no rule can be trusted — a custom
 * `date_format`, or a locale whose ranges do not read like its single dates —
 * both ends are spelled out in full instead.
 *
 * Returns `''` when `range`, `from`, or `to` is missing.
 *
 * @param range     - The range to format.
 * @param [options] - Formatting options.
 * @return The formatted range.
 *
 * @example
 * formatDateRange( { from, to } ) // same day:  'June 21, 2025'
 *                                 // elided:    'June 21 – 25, 2025'
 *                                 // spelt out: 'June 21, 2025 – June 25, 2025'
 */
export const formatDateRange = (
	range?: DateRange,
	options: FormatDateRangeOptions = {}
): string => formatRange( 'medium', range, options );

/**
 * Format a date range with the month abbreviated.
 *
 * For controls sized by the row they sit in rather than by their content, where
 * a spelled-out month costs width the row does not have. Everything else
 * follows `formatDateRange`, including the elision, so the two stay one
 * typographic system.
 *
 * The abbreviation comes from WordPress's translation tables, so a locale that
 * does not shorten its month names is left with the full form and simply reads
 * the same as `formatDateRange`.
 *
 * @param range - The range to format.
 * @return The formatted range.
 *
 * @example
 * formatDateRangeCompact( { from, to } ) // same day:  'Jun 21, 2025'
 *                                        // elided:    'Jun 21 – 25, 2025'
 *                                        // spelt out: 'Jun 21, 2025 – Jun 25, 2025'
 */
export const formatDateRangeCompact = ( range?: DateRange ): string =>
	formatRange( 'compact', range );

/**
 * Format a date range in the shortest form that still identifies it.
 *
 * For controls that carry a range as their own label, where every character is
 * width taken from something else on the row. It drops the year on top of what
 * `formatDateRangeCompact` already shortens, but only while the whole range
 * sits in the current year — a range anywhere else needs its year to say which
 * one it is, and reads as the compact form instead.
 *
 * "Current" is the site's own year, since the year each end falls in is read in
 * the site's timezone like every other date the dashboard renders.
 *
 * @param range - The range to format.
 * @return The formatted range.
 *
 * @example
 * formatDateRangeMinimal( { from, to } ) // this year:  'Jul 24' / 'Jul 13 – 26'
 *                                        // any other: 'Jun 21, 2025'
 */
export const formatDateRangeMinimal = ( range?: DateRange ): string => {
	const { from, to } = range ?? {};

	if ( ! from || ! to ) {
		return '';
	}

	const currentYear = formatDate( Date.now(), 'year' );
	const isCurrentYear =
		formatDate( from, 'year' ) === currentYear && formatDate( to, 'year' ) === currentYear;

	return formatRange( isCurrentYear ? 'compactNoYear' : 'compact', range );
};

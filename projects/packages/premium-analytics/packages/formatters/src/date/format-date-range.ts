/**
 * Internal dependencies
 */
import { formatDate } from './format-date';

/**
 * A date range with optional start and end.
 *
 * Defined locally to avoid a cross-package import on
 * `@jetpack-premium-analytics/datetime` (which exports an identical
 * `DateRange` type). Switch to that import once the sibling-package
 * `link:` wiring is settled.
 */
type DateRange = { from?: Date; to?: Date };

/** En dash, the conventional range separator. */
const RANGE_SEPARATOR = ' – ';

/**
 * Format a date range into a human-readable string.
 *
 * Both ends are spelled out because WordPress provides no locale-specific
 * range-elision rules.
 *
 * Returns `''` when `range`, `from`, or `to` is missing.
 *
 * @param range - The range to format.
 * @return The formatted range.
 *
 * @example
 * formatDateRange( { from, to } ) // same day: 'June 21, 2025'
 *                                 // range:    'June 21, 2025 – June 25, 2025'
 */
export const formatDateRange = ( range?: DateRange ): string => {
	const { from, to } = range ?? {};

	if ( ! from || ! to ) {
		return '';
	}

	// Compare complete site-local dates because the display format may omit the year.
	if ( formatDate( from, 'iso' ) === formatDate( to, 'iso' ) ) {
		return formatDate( from );
	}

	return `${ formatDate( from ) }${ RANGE_SEPARATOR }${ formatDate( to ) }`;
};

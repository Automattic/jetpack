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
 * Both ends are spelled out in full. Shortening a range by eliding the shared
 * month or year ("Jun 21-25, 2025") follows English typographic convention and
 * does not carry over: applied to a Spanish site it yields
 * "21 de junio-25 de junio de 2025". WordPress publishes whole date formats
 * only, with no per-locale elision rules to draw on, so the repetition is kept
 * in exchange for being right in every locale.
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

	// Collapse on the calendar day rather than on the rendered strings: a site
	// whose `date_format` carries no year would otherwise fold
	// "June 21, 2024 – June 21, 2025" into a single date. `iso` is fixed and
	// resolves in the site's timezone, the same zone the display format renders
	// in, so the two agree on where the day boundary falls.
	if ( formatDate( from, 'iso' ) === formatDate( to, 'iso' ) ) {
		return formatDate( from );
	}

	return `${ formatDate( from ) }${ RANGE_SEPARATOR }${ formatDate( to ) }`;
};

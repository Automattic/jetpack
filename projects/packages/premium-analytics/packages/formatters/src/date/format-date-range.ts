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

/**
 * Format a date range into a human-readable string.
 * Adjusts output based on whether dates share the same day, month, or year.
 * Returns `''` when `range`, `from`, or `to` is missing.
 *
 * @example
 * formatDateRange( { from, to } ) // same day:    'Jun 21, 2025'
 *                                  // same month:  'Jun 21-25, 2025'
 *                                  // same year:   'Jun 21-Jul 25, 2025'
 *                                  // cross-year:  'Jun 21, 2024-Jul 25, 2025'
 */
export const formatDateRange = ( range?: DateRange ): string => {
	if ( ! range ) {
		return '';
	}

	const { from, to } = range;

	if ( ! from || ! to ) {
		return '';
	}

	const sameYear = from.getFullYear() === to.getFullYear();
	const sameMonth = sameYear && from.getMonth() === to.getMonth();
	const sameDay = sameMonth && from.getDate() === to.getDate();

	if ( sameDay ) {
		return formatDate( from, 'medium' );
	}

	if ( sameMonth ) {
		return `${ formatDate( from, 'short' ) }-${ formatDate( to, 'd, yyyy' ) }`;
	}

	if ( sameYear ) {
		return `${ formatDate( from, 'short' ) }-${ formatDate( to ) }`;
	}

	return `${ formatDate( from ) }-${ formatDate( to ) }`;
};

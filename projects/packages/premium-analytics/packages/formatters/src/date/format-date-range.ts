/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { elideRange } from './elide-range';
import { formatDate } from './format-date';
import type { DateRange } from './types';

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
 * @param range - The range to format.
 * @return The formatted range.
 *
 * @example
 * formatDateRange( { from, to } ) // same day:  'June 21, 2025'
 *                                 // elided:    'June 21 – 25, 2025'
 *                                 // spelt out: 'June 21, 2025 – June 25, 2025'
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

	return (
		elideRange( from, to ) ??
		sprintf(
			/* translators: 1: Start date. 2: End date. */
			__( '%1$s – %2$s', 'jetpack-premium-analytics-pkg' ),
			formatDate( from ),
			formatDate( to )
		)
	);
};

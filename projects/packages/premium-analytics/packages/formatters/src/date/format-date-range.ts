/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { formatDate } from './format-date';
import type { DateRange } from './types';

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

	return sprintf(
		/* translators: 1: Start date. 2: End date. */
		__( '%1$s – %2$s', 'jetpack-premium-analytics-pkg' ),
		formatDate( from ),
		formatDate( to )
	);
};

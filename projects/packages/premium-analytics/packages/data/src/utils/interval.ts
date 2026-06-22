/**
 * External dependencies
 */
import { differenceInCalendarDays, differenceInHours } from 'date-fns';
/**
 * Internal dependencies
 */
import { localTZDate } from './date';
import type { IntervalType } from './search';

export function getDaysBetweenInclusive( from: string, to: string ): number {
	const fromDate = new Date( `${ from }T00:00:00Z` );
	const toDate = new Date( `${ to }T00:00:00Z` );
	const days = differenceInCalendarDays( toDate, fromDate );

	if ( Number.isNaN( days ) || days < 0 ) {
		// Keep range-based requests bounded even when callers pass an invalid range.
		return 1;
	}

	return days + 1;
}

function getAllowedIntervalsByRange( from: string, to: string ): IntervalType[] {
	// Use hours instead of days to handle ranges that are 1 second short of a full day.
	// E.g., '2024-11-01 00:00:00' to '2025-10-31 23:59:59' is 8759 hours (364.958 days),
	// which rounds to 365 days, correctly categorizing it as a yearly interval.
	const daysDiff = Math.round(
		Math.abs( differenceInHours( localTZDate( to ), localTZDate( from ) ) / 24 )
	);

	if ( daysDiff >= 1095 ) {
		return [ 'quarter', 'year' ];
	} else if ( daysDiff >= 365 ) {
		return [ 'month', 'quarter' ];
	} else if ( daysDiff >= 90 ) {
		return [ 'week', 'month' ];
	} else if ( daysDiff >= 28 ) {
		return [ 'day', 'week' ];
	} else if ( daysDiff >= 3 ) {
		return [ 'day' ];
	} else if ( daysDiff >= 1 ) {
		return [ 'hour', 'day' ];
	}

	return [ 'hour', 'day' ];
}

/**
 * Returns the allowed selectable intervals for a specific period.
 *
 * @return {Array} Array containing allowed intervals.
 */
function getAllowedIntervalsForPeriod(
	period: string | undefined,
	from: string,
	to: string
): IntervalType[] {
	switch ( period ) {
		case 'today':
		case 'yesterday':
			return [ 'hour', 'day' ];
		case 'last-7-days':
			return [ 'day' ];
		case 'last-30-days':
		case 'last-month':
			return [ 'day', 'week' ];
		case 'last-90-days':
			return [ 'week', 'month' ];
		case 'last-12-months':
		case 'last-365-days':
		case 'last-year':
			return [ 'month', 'quarter' ];
		default:
			return getAllowedIntervalsByRange( from, to );
	}
}

export function getDefaultIntervalForPeriod(
	period: string | undefined,
	from: string,
	to: string
): IntervalType {
	return getAllowedIntervalsForPeriod( period, from, to )?.[ 0 ] ?? 'day';
}

export function getDateFormatFromInterval(
	period: string | undefined, // Pass in undefined to use the default interval.
	from: string,
	to: string
): string {
	const interval = getDefaultIntervalForPeriod( period, from, to );

	switch ( interval ) {
		case 'hour':
			return 'HH:mm';
		case 'day':
		case 'week':
			return 'MMM d';
		case 'month':
			return 'MMM yyyy';
		case 'quarter':
			return 'qqq yyyy';
		case 'year':
			return 'yyyy';
		default:
			return 'MMM d';
	}
}

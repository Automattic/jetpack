/**
 * External dependencies
 */
import {
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_24_HOURS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_LAST_7_DAYS,
	PRESET_LAST_90_DAYS,
	PRESET_LAST_MONTH,
	PRESET_LAST_YEAR,
	PRESET_TODAY,
	PRESET_YESTERDAY,
	isIntervalType,
	type IntervalType,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { differenceInCalendarDays, differenceInHours } from 'date-fns';
/**
 * Internal dependencies
 */
import { localTZDate } from './date';

export type { IntervalType };

export function getDaysBetweenInclusive( from: string, to: string ): number {
	// Anchor both dates in UTC before diffing: `differenceInCalendarDays` reads
	// its arguments' local calendar getters, and a plain UTC-tagged `Date`'s
	// getters reflect the machine's local timezone, not UTC. Left unanchored,
	// a negative-offset machine can read a UTC midnight instant as the
	// previous local calendar day, shifting the day count.
	const fromDate = localTZDate( `${ from }T00:00:00Z`, '+00:00' );
	const toDate = localTZDate( `${ to }T00:00:00Z`, '+00:00' );
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
	} else if ( daysDiff >= 2 ) {
		return [ 'hour', 'day' ];
	}

	// A day or less has nothing to draw in daily buckets: one bar is not a
	// series. Hours are the only reading of it.
	return [ 'hour' ];
}

/**
 * Allowed intervals for a preset, ordered finest-first.
 *
 * Unknown / custom / year-surface presets derive the list from `from`–`to`
 * length.
 *
 * Also what the interval control lists, so the menu can never offer a bucket
 * the range would coerce away.
 *
 * @param preset - Primary date-range preset, when known.
 * @param from   - Range start.
 * @param to     - Range end.
 * @return Allowed intervals, finest first.
 */
export function getAllowedIntervalsForPreset(
	preset: PrimaryPresetId | undefined,
	from: string,
	to: string
): IntervalType[] {
	switch ( preset ) {
		/*
		 * Hours alone. A single day bucketed by day is one bar, so offering it
		 * let a `day` carried over from a longer preset survive the switch and
		 * flatten the whole window into a point.
		 */
		case PRESET_TODAY:
		case PRESET_YESTERDAY:
		case PRESET_LAST_24_HOURS:
			return [ 'hour' ];
		case PRESET_LAST_7_DAYS:
			return [ 'day' ];
		case PRESET_LAST_30_DAYS:
		case PRESET_LAST_MONTH:
			return [ 'day', 'week' ];
		case PRESET_LAST_90_DAYS:
			return [ 'week', 'month' ];
		case PRESET_LAST_12_MONTHS:
		case PRESET_LAST_365_DAYS:
		case PRESET_LAST_YEAR:
			return [ 'month', 'quarter' ];
		default:
			return getAllowedIntervalsByRange( from, to );
	}
}

/**
 * Resolve a valid interval for a date range.
 *
 * Returns `current` when it is allowed for the range; otherwise the range
 * default (finest allowed).
 *
 * @param preset  - Primary date-range preset, when known.
 * @param from    - Range start.
 * @param to      - Range end.
 * @param current - Candidate interval to keep when still allowed.
 * @return An interval allowed for the range.
 */
export function resolveIntervalForRange(
	preset: PrimaryPresetId | undefined,
	from: string,
	to: string,
	current?: string
): IntervalType {
	const allowed = getAllowedIntervalsForPreset( preset, from, to );

	if ( isIntervalType( current ) && allowed.includes( current ) ) {
		return current;
	}

	return allowed[ 0 ] ?? 'day';
}

/**
 * Default (finest) interval for a preset / date range.
 *
 * @param preset - Primary date-range preset, when known.
 * @param from   - Range start.
 * @param to     - Range end.
 * @return The default interval.
 */
export function getDefaultIntervalForPeriod(
	preset: PrimaryPresetId | undefined,
	from: string,
	to: string
): IntervalType {
	return resolveIntervalForRange( preset, from, to );
}

export function getDateFormatFromInterval(
	preset: PrimaryPresetId | undefined,
	from: string,
	to: string
): string {
	const interval = getDefaultIntervalForPeriod( preset, from, to );

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

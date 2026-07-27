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
	isPrimaryPreset,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { differenceInCalendarDays, differenceInHours } from 'date-fns';
/**
 * Internal dependencies
 */
import { localTZDate } from './date';

/**
 * Bucket sizes the report window / Stats time-series APIs understand.
 */
export type IntervalType = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

const INTERVAL_TYPES = [
	'hour',
	'day',
	'week',
	'month',
	'quarter',
	'year',
] as const satisfies readonly IntervalType[];

/**
 * Whether a value is a known report-window interval.
 *
 * @param value - Candidate from URL search or other untyped input.
 * @return Whether the value is an `IntervalType`.
 */
function isIntervalType( value: unknown ): value is IntervalType {
	return typeof value === 'string' && ( INTERVAL_TYPES as readonly string[] ).includes( value );
}

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
	} else if ( daysDiff >= 1 ) {
		return [ 'hour', 'day' ];
	}

	return [ 'hour', 'day' ];
}

/**
 * Allowed intervals for a primary preset, or for a custom / year-surface
 * window via the length of `from`–`to`.
 *
 * @param preset - Primary date-range preset, when known.
 * @param from   - Range start.
 * @param to     - Range end.
 * @return Allowed intervals, finest first.
 */
function getAllowedIntervalsForPreset(
	preset: PrimaryPresetId | undefined,
	from: string,
	to: string
): IntervalType[] {
	switch ( preset ) {
		case PRESET_TODAY:
		case PRESET_YESTERDAY:
		case PRESET_LAST_24_HOURS:
			return [ 'hour', 'day' ];
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
			// `custom`, year-surface presets, and unknown fall through to range length.
			return getAllowedIntervalsByRange( from, to );
	}
}

/**
 * Resolve the report-window interval for a date range.
 *
 * Keeps `current` when it is still allowed for the range; otherwise falls back
 * to the range's default. Used by URL normalization and date-filter commits so
 * the query string never carries an interval the active window cannot support.
 *
 * @param preset  - Primary date-range preset, when known.
 * @param from    - Range start.
 * @param to      - Range end.
 * @param current - Interval already in the URL / search state, if any.
 * @return A valid interval for the range.
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

/**
 * Whether the URL's report-window date params need a seed / redirect.
 *
 * True when `from` / `to` / `interval` are missing, or when `interval` is not
 * allowed for the current preset / range. Routes use this in `beforeLoad` so a
 * hand-edited or stale deep link cannot keep an invalid bucket size.
 *
 * @param search          - Candidate URL search params.
 * @param search.from     - Range start.
 * @param search.to       - Range end.
 * @param search.interval - Report-window interval.
 * @param search.preset   - Date-range preset id, when present.
 * @return Whether the route should redirect to a normalized search.
 */
export function needsReportDateParamsSeed( search?: {
	from?: string;
	to?: string;
	interval?: string;
	preset?: string;
} ): boolean {
	if ( ! search?.from || ! search?.to || ! search?.interval ) {
		return true;
	}

	const preset = isPrimaryPreset( search.preset ) ? search.preset : undefined;
	return (
		resolveIntervalForRange( preset, search.from, search.to, search.interval ) !== search.interval
	);
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

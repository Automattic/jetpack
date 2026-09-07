/**
 * External dependencies
 */
import {
	getDatePart,
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
	localTZDate,
	type IntervalType,
	type PrimaryPresetId,
} from '@jetpack-premium-analytics/datetime';
import { differenceInCalendarDays, differenceInHours } from 'date-fns';

export type { IntervalType };

export function getDaysBetweenInclusive( from: string, to: string ): number {
	// Callers may pass a full offset-bearing ISO datetime rather than a bare
	// `yyyy-MM-dd`, so take the calendar day first.
	const fromDay = getDatePart( from );
	const toDay = getDatePart( to );

	// Anchor both dates in UTC before diffing: `differenceInCalendarDays` reads
	// local calendar getters, so on a negative-offset machine a UTC midnight
	// instant reads as the previous day and shifts the count.
	const fromDate = localTZDate( `${ fromDay }T00:00:00Z`, '+00:00' );
	const toDate = localTZDate( `${ toDay }T00:00:00Z`, '+00:00' );
	const days = differenceInCalendarDays( toDate, fromDate );

	if ( Number.isNaN( days ) || days < 0 ) {
		// Keep range-based requests bounded even when callers pass an invalid range.
		return 1;
	}

	return days + 1;
}

function getAllowedIntervalsByRange( from: string, to: string ): IntervalType[] {
	// Hours, not days, so a range one second short of a full year (8759 hours)
	// still rounds to 365 and categorizes as yearly.
	const daysDiff = Math.round(
		Math.abs( differenceInHours( localTZDate( to ), localTZDate( from ) ) / 24 )
	);

	// No bucket between month and year: Stats has no quarterly one.
	if ( daysDiff >= 1095 ) {
		return [ 'month', 'year' ];
	} else if ( daysDiff >= 365 ) {
		return [ 'month' ];
	} else if ( daysDiff >= 90 ) {
		return [ 'week', 'month' ];
	} else if ( daysDiff >= 28 ) {
		return [ 'day', 'week' ];
	} else if ( daysDiff >= 7 ) {
		return [ 'day' ];
	} else if ( daysDiff >= 2 ) {
		// Days by default; hours stay on offer as the only reading that shows
		// shape within a day.
		return [ 'day', 'hour' ];
	}

	// A day or less has nothing to draw in daily buckets: one bar is not a
	// series. Hours are the only reading of it.
	return [ 'hour' ];
}

/**
 * Allowed intervals for a preset, default first.
 *
 * Where the interval control starts, before a widget narrows it to what its
 * chart can draw (`drawableIntervals`). Callers pass the range being edited,
 * not the applied one: a bucket it would coerce away springs back on Apply.
 */
export function getAllowedIntervalsForPreset(
	preset: PrimaryPresetId | undefined,
	from: string,
	to: string
): IntervalType[] {
	switch ( preset ) {
		/*
		 * Hours alone: a single day bucketed by day is one bar, and offering
		 * `day` would let a bucket carried over from a longer preset flatten
		 * the whole window into a point.
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
			return [ 'month' ];
		default:
			return getAllowedIntervalsByRange( from, to );
	}
}

/**
 * Resolve a valid interval for a date range.
 *
 * Returns `current` when it is allowed for the range; otherwise the range
 * default (first allowed).
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

/** Default interval for a preset / date range. */
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
		case 'year':
			return 'yyyy';
		default:
			return 'MMM d';
	}
}

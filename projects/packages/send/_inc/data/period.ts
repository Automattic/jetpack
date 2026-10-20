import { date as phpDate } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { addDays, dayLabel, daysBetween, isYmd, parseUtc, siteToday } from './dates';
import type { Period, PeriodPreset, SendStatus, StatsBucket, StatsDay } from './types';

export const PERIOD_PRESETS: PeriodPreset[] = [ 1, 7, 30, 90, 180, 365 ];
export const DEFAULT_STATS_PERIOD: Period = { range: 90 };

/** Search params that hold a period, in the Log and on the Overview. */
export const RANGE_PARAM = 'range';
export const START_PARAM = 'start';
export const END_PARAM = 'end';
/** Older links' "last N days"; read on landing only. */
const DAYS_PARAM = 'days';

/** The longest span any period may cover, as the server's `days` and `range` args allow. */
const MAX_SPAN_DAYS = 36500;

/**
 * Whether a number is one of the presets.
 *
 * @param value - Anything.
 * @return True for 1, 7, 30, 90, 180 or 365.
 */
export function isPreset( value: unknown ): value is PeriodPreset {
	return PERIOD_PRESETS.includes( value as PeriodPreset );
}

// The router parses `range=7` as a number, so both are read.
const asText = ( value: unknown ): string => {
	if ( typeof value === 'number' ) {
		return String( value );
	}
	return typeof value === 'string' ? value.trim() : '';
};

/**
 * A custom period, if the days make one: real days, start on or before end, end not after today,
 * and no longer than `maxDays` when that's set.
 *
 * @param start   - First day.
 * @param end     - Last day.
 * @param today   - Site-local today.
 * @param maxDays - Longest span in days; 0 for no cap.
 * @return The period, or null.
 */
function customPeriod( start: string, end: string, today: string, maxDays: number ): Period | null {
	if ( ! isYmd( start ) || ! isYmd( end ) || start > end || end > today ) {
		return null;
	}
	const span = daysBetween( start, end ) + 1;
	return span > MAX_SPAN_DAYS || ( maxDays > 0 && span > maxDays ) ? null : { start, end };
}

export type ParsePeriodOptions = {
	/** Longest custom span in days; 0 for no cap. The dashboard passes 365. */
	maxDays?: number;
	/** Site-local today, for tests. */
	today?: string;
};

/**
 * The period a link or reload asked for: `start` + `end`, else a preset `range`, else an older
 * link's `days` (1 is today, N the last N days). Anything unreadable gives the fallback.
 *
 * @param search          - The route's search params.
 * @param fallback        - The period with no params, e.g. 90 days on the Overview, null in the Log.
 * @param options         - Options.
 * @param options.maxDays - Longest custom span in days; 0 for no cap.
 * @param options.today   - Site-local today.
 * @return The period, or null for any date.
 */
export function parsePeriod(
	search: Record< string, unknown > | undefined,
	fallback: Period | null,
	{ maxDays = 0, today = siteToday() }: ParsePeriodOptions = {}
): Period | null {
	const start = asText( search?.[ START_PARAM ] );
	const end = asText( search?.[ END_PARAM ] );
	if ( start || end ) {
		return customPeriod( start, end, today, maxDays ) ?? fallback;
	}
	const range = asText( search?.[ RANGE_PARAM ] );
	if ( range ) {
		const value = Number( range );
		return isPreset( value ) ? { range: value } : fallback;
	}
	const days = Number( asText( search?.[ DAYS_PARAM ] ) );
	if ( ! Number.isInteger( days ) || days < 1 ) {
		return fallback;
	}
	if ( days === 1 ) {
		return { start: today, end: today };
	}
	if ( isPreset( days ) ) {
		return { range: days };
	}
	const count = Math.min( days, MAX_SPAN_DAYS );
	return customPeriod( addDays( today, 1 - count ), today, today, maxDays ) ?? fallback;
}

/**
 * Whether two periods are the same (null is "any date").
 *
 * @param a - A period.
 * @param b - Another.
 * @return True when they match.
 */
export function samePeriod( a: Period | null, b: Period | null ): boolean {
	if ( ! a || ! b ) {
		return a === b;
	}
	return periodKey( a ) === periodKey( b );
}

/**
 * Search params for a period, for `navigate( { search } )`. Every period key is listed, so the
 * old ones (an old `days` too) leave the address; the fallback gives no params at all.
 *
 * @param period   - The period, or null for any date.
 * @param fallback - The period the screen shows with no params.
 * @return Params; `range` is a number so the router doesn't quote it.
 */
export function periodSearch(
	period: Period | null,
	fallback: Period | null
): Record< string, string | number | undefined > {
	const params: Record< string, string | number | undefined > = {
		[ RANGE_PARAM ]: undefined,
		[ START_PARAM ]: undefined,
		[ END_PARAM ]: undefined,
		[ DAYS_PARAM ]: undefined,
	};
	if ( ! period || samePeriod( period, fallback ) ) {
		return params;
	}
	if ( 'range' in period ) {
		params[ RANGE_PARAM ] = period.range;
	} else {
		params[ START_PARAM ] = period.start;
		params[ END_PARAM ] = period.end;
	}
	return params;
}

/**
 * REST args for a period: `range`, or `start` and `end`; none for any date.
 *
 * @param period - The period.
 * @return Args.
 */
export function periodArgs( period: Period | null ): Record< string, string | number > {
	if ( ! period ) {
		return {};
	}
	return 'range' in period ? { range: period.range } : { start: period.start, end: period.end };
}

/**
 * A stable string for a period, used as the store's stats key: `r90` or `s2026-09-01_2026-10-19`.
 *
 * @param period - The period.
 * @return The key.
 */
export function periodKey( period: Period ): string {
	return 'range' in period ? `r${ period.range }` : `s${ period.start }_${ period.end }`;
}

/**
 * The period a key names. Also takes an older bare number of days (7, 30); anything else is the
 * dashboard's default.
 *
 * @param key - From `periodKey()`, or a number of days.
 * @return The period.
 */
export function periodFromKey( key: string | number ): Period {
	const text = String( key );
	const preset = /^r?(\d+)$/.exec( text );
	if ( preset ) {
		const value = Number( preset[ 1 ] );
		return isPreset( value ) ? { range: value } : DEFAULT_STATS_PERIOD;
	}
	const custom = /^s(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/.exec( text );
	if ( custom && isYmd( custom[ 1 ] ) && isYmd( custom[ 2 ] ) && custom[ 1 ] <= custom[ 2 ] ) {
		return { start: custom[ 1 ], end: custom[ 2 ] };
	}
	return DEFAULT_STATS_PERIOD;
}

/**
 * Two days as one short span: "Sep 1 – Oct 19", with years only when they aren't both this one.
 *
 * @param start - First day.
 * @param end   - Last day.
 * @param today - Site-local today.
 * @return The span, or one day ("Oct 19") when they're the same.
 */
function shortSpan( start: string, end: string, today: string ): [ string, string ] | string {
	const year = today.slice( 0, 4 );
	const sameYear = start.slice( 0, 4 ) === end.slice( 0, 4 );
	if ( start === end ) {
		return dayLabel( start, start.slice( 0, 4 ) === year ? 'M j' : 'M j, Y' );
	}
	if ( sameYear && start.slice( 0, 4 ) === year ) {
		return [ dayLabel( start ), dayLabel( end ) ];
	}
	if ( sameYear ) {
		return [ dayLabel( start ), dayLabel( end, 'M j, Y' ) ];
	}
	return [ dayLabel( start, 'M j, Y' ), dayLabel( end, 'M j, Y' ) ];
}

/**
 * Two labels joined as a span.
 *
 * @param first - The first day's label.
 * @param last  - The last day's label.
 * @return "Sep 1 – Oct 19".
 */
function joinSpan( first: string, last: string ): string {
	/* translators: 1: first day, 2: last day, e.g. "Sep 1 – Oct 19". */
	return sprintf( __( '%1$s – %2$s', 'jetpack-send-pkg' ), first, last );
}

/**
 * What a date control shows for a period: "Last 90 days", "Last 24 hours", "Sep 1 – Oct 19"
 * ("Dec 1, 2025 – Jan 15, 2026" across years), or "Any date".
 *
 * @param period - The period, or null.
 * @param today  - Site-local today.
 * @return The label.
 */
export function periodLabel( period: Period | null, today: string = siteToday() ): string {
	if ( ! period ) {
		return __( 'Any date', 'jetpack-send-pkg' );
	}
	if ( 'range' in period ) {
		return period.range === 1
			? __( 'Last 24 hours', 'jetpack-send-pkg' )
			: sprintf(
					/* translators: %d: number of days. */
					_n( 'Last %d day', 'Last %d days', period.range, 'jetpack-send-pkg' ),
					period.range
				);
	}
	const span = shortSpan( period.start, period.end, today );
	return typeof span === 'string' ? span : joinSpan( ...span );
}

/**
 * The period inside a sentence: "in the last 90 days", "in the last 24 hours",
 * "between Sep 1 and Oct 19", or "on Oct 19" for one day.
 *
 * @param period - The period.
 * @param today  - Site-local today.
 * @return The phrase.
 */
export function periodPhrase( period: Period, today: string = siteToday() ): string {
	if ( 'range' in period ) {
		return period.range === 1
			? __( 'in the last 24 hours', 'jetpack-send-pkg' )
			: sprintf(
					/* translators: %d: number of days. */
					_n( 'in the last %d day', 'in the last %d days', period.range, 'jetpack-send-pkg' ),
					period.range
				);
	}
	const span = shortSpan( period.start, period.end, today );
	if ( typeof span === 'string' ) {
		/* translators: %s: a day, e.g. "Oct 19". */
		return sprintf( __( 'on %s', 'jetpack-send-pkg' ), span );
	}
	/* translators: 1: first day, 2: last day, e.g. "between Sep 1 and Oct 19". */
	return sprintf( __( 'between %1$s and %2$s', 'jetpack-send-pkg' ), ...span );
}

/**
 * The real dates a range covers, with the year once: "Jul 22 – Oct 19, 2026", or
 * "Dec 1, 2025 – Jan 15, 2026" across years.
 *
 * @param from - First site-local day, `Y-m-d`.
 * @param to   - Last site-local day.
 * @return The dates.
 */
export function rangeDates( from: string, to: string ): string {
	if ( from === to ) {
		return dayLabel( to, 'M j, Y' );
	}
	const first = dayLabel( from, from.slice( 0, 4 ) === to.slice( 0, 4 ) ? 'M j' : 'M j, Y' );
	return joinSpan( first, dayLabel( to, 'M j, Y' ) );
}

/**
 * Days a period covers, counting today as day one (1 for the last 24 hours).
 *
 * @param period - The period.
 * @param today  - Site-local today; a custom end after it counts up to it.
 * @return Days, at least 1.
 */
export function spanDays( period: Period, today: string = siteToday() ): number {
	if ( 'range' in period ) {
		return period.range;
	}
	const end = period.end > today ? today : period.end;
	const days = daysBetween( period.start, end ) + 1;
	return Number.isFinite( days ) && days > 0 ? days : 1;
}

/**
 * The days a preset covers, for seeding the calendar. The last 24 hours gives today alone.
 *
 * @param preset - The preset.
 * @param today  - Site-local today.
 * @return First and last day.
 */
export function presetDays(
	preset: PeriodPreset,
	today: string = siteToday()
): { start: string; end: string } {
	return { start: addDays( today, 1 - preset ), end: today };
}

/**
 * The presets that fit inside what the log keeps.
 *
 * @param retentionDays - Days the log keeps emails; 0 for forever.
 * @return Presets no longer than that; all six for forever.
 */
export function presetsWithin( retentionDays: number ): PeriodPreset[] {
	return retentionDays > 0
		? PERIOD_PRESETS.filter( preset => preset <= retentionDays )
		: [ ...PERIOD_PRESETS ];
}

/**
 * What one chart bar stands for: hours for one day, days up to 90 (weeks past 31 on a phone),
 * then weeks.
 *
 * @param days   - Days the chart draws.
 * @param narrow - Phone width.
 * @return The unit.
 */
export function bucketUnit( days: number, narrow: boolean ): 'hour' | 'day' | 'week' {
	if ( days <= 1 ) {
		return 'hour';
	}
	if ( days > 90 || ( narrow && days > 31 ) ) {
		return 'week';
	}
	return 'day';
}

/**
 * Days grouped into weeks. The first week starts on the range's first day (it may be short);
 * later ones on the site's first day of the week.
 *
 * @param days         - Days, oldest first.
 * @param weekStartsOn - 0 for Sunday … 6 for Saturday.
 * @param today        - Site-local today; the week that holds it is `partial`.
 * @return The weeks.
 */
export function groupByWeek(
	days: StatsDay[],
	weekStartsOn: number,
	today: string = siteToday()
): StatsBucket[] {
	const weeks: StatsBucket[] = [];
	days.forEach( ( day, index ) => {
		// Noon UTC keeps the weekday fixed whatever the browser's timezone.
		const weekday = new Date( `${ day.date }T12:00:00Z` ).getUTCDay();
		if ( index === 0 || weekday === weekStartsOn ) {
			weeks.push( {
				start: day.date,
				end: day.date,
				sent: 0,
				fallback: 0,
				failed: 0,
				partial: false,
			} );
		}
		const week = weeks[ weeks.length - 1 ];
		week.end = day.date;
		week.sent += day.sent;
		week.fallback += day.fallback;
		week.failed += day.failed;
		week.partial = week.partial || day.date === today;
	} );
	return weeks;
}

/**
 * How long the log keeps emails, as the Settings select names it.
 *
 * @param days - Days; 0 for forever.
 * @return "1 week", "3 months", "Forever", or "14 days" for a value the site's code set.
 */
export function retentionLabel( days: number ): string {
	switch ( days ) {
		case 1:
			return __( '1 day', 'jetpack-send-pkg' );
		case 7:
			return __( '1 week', 'jetpack-send-pkg' );
		case 30:
			return __( '1 month', 'jetpack-send-pkg' );
		case 90:
			return __( '3 months', 'jetpack-send-pkg' );
		case 180:
			return __( '6 months', 'jetpack-send-pkg' );
		case 365:
			return __( '1 year', 'jetpack-send-pkg' );
	}
	if ( days <= 0 ) {
		return __( 'Forever', 'jetpack-send-pkg' );
	}
	/* translators: %d: number of days. */
	return sprintf( _n( '%d day', '%d days', days, 'jetpack-send-pkg' ), days );
}

/**
 * How long the log keeps emails, in one sentence.
 *
 * @param days - Days; 0 for forever.
 * @return "Emails are kept for 1 week." or "Emails are kept until you delete them."
 */
export function retentionSentence( days: number ): string {
	return days > 0
		? sprintf(
				/* translators: %s: how long, e.g. "1 week". */
				__( 'Emails are kept for %s.', 'jetpack-send-pkg' ),
				retentionLabel( days )
			)
		: __( 'Emails are kept until you delete them.', 'jetpack-send-pkg' );
}

/**
 * The first day the Log can show: the site-local day of its oldest email, or today when it's empty.
 *
 * @param status                 - The status payload.
 * @param status.log_covers_from - The oldest email, ISO 8601 UTC.
 * @param today                  - Site-local today.
 * @return `Y-m-d`.
 */
export function coversFromDay(
	status: Pick< SendStatus, 'log_covers_from' >,
	today: string = siteToday()
): string {
	const when = status.log_covers_from ? parseUtc( status.log_covers_from ) : null;
	return when && ! isNaN( when.getTime() ) ? phpDate( 'Y-m-d', when ) : today;
}

/**
 * The days from the site's first counted day on, so a new site's chart doesn't open on empty bars.
 *
 * @param days  - Days, oldest first.
 * @param since - The first counted day (`stats_since`); null keeps every day.
 * @return The days to draw.
 */
export function trimToSince( days: StatsDay[], since: string | null ): StatsDay[] {
	return since ? days.filter( day => day.date >= since ) : days;
}

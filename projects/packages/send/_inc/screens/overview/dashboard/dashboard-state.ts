import { dateI18n, getSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { dayLabel, localDay, parseUtc, siteToday } from '../../../data/dates';
import {
	DEFAULT_STATS_PERIOD,
	bucketUnit,
	groupByWeek,
	periodSearch,
	rangeDates,
	trimToSince,
} from '../../../data/period';
import type { Period, Stats } from '../../../data/types';

/** What the activity card shows. */
export type DashboardState = 'loading' | 'error' | 'just-finished' | 'no-data' | 'normal';

/** What one chart bar stands for. */
export type ChartUnit = 'hour' | 'day' | 'week';

/** One chart bar: an hour, a day or a week. */
export type ChartBucket = {
	/** Where the bar sits: the hour's start, or the browser-local midnight of its first day. */
	date: Date;
	/** First and last site-local day, `Y-m-d`; '' for hours. */
	start: string;
	end: string;
	sent: number;
	fallback: number;
	failed: number;
	/** The current hour, day or week, so it's still filling up. */
	partial: boolean;
};

/** One metric tab: its total for the period and its value per bar. */
export type Metric = {
	key: 'emails' | 'sent' | 'fallback' | 'failed';
	label: string;
	value: number;
	series: { date: Date; value: number }[];
};

/**
 * The one problem worth a notice at the top of Email activity, worst first: how many the counts
 * saw, and how many of those are still in the log.
 */
export type Attention = { kind: 'failed' | 'fallback'; count: number; inLog: number } | null;

const HOUR_MS = 3600000;

/**
 * In-app href for the Overview at a period; the default needs no params.
 *
 * @param period - The period.
 * @return The href.
 */
export function periodHref( period: Period ): string {
	const params = Object.entries( periodSearch( period, DEFAULT_STATS_PERIOD ) )
		.filter( ( [ , value ] ) => value !== undefined )
		.map( ( [ key, value ] ) => `${ key }=${ encodeURIComponent( String( value ) ) }` );
	return params.length ? `/?${ params.join( '&' ) }` : '/';
}

/**
 * The period a set of stats counted, so labels and links match the numbers on screen while
 * another period loads.
 *
 * @param stats - The stats.
 * @return The period.
 */
export function statsPeriod( stats: Stats ): Period {
	return stats.range ? { range: stats.range } : { start: stats.from, end: stats.to };
}

/**
 * Pick the activity card's state. A site with only a test never sees a chart of zeros. While the
 * stats load, a site the status says has no history goes straight to its empty state, so it never
 * flashes the busy layout's skeleton first.
 *
 * @param args            - Inputs.
 * @param args.stats      - Stats, or null while loading.
 * @param args.error      - The load error, if any.
 * @param args.testSentAt - When a test first went out, from the onboarding state.
 * @param args.hasHistory - The status payload's `has_history`, when it has one.
 * @return The state.
 */
export function dashboardState( {
	stats,
	error,
	testSentAt,
	hasHistory,
}: {
	stats: Stats | null;
	error: string | null;
	testSentAt: string | null;
	hasHistory?: boolean;
} ): DashboardState {
	if ( error ) {
		return 'error';
	}
	if ( ! stats && hasHistory !== false ) {
		return 'loading';
	}
	if ( stats?.has_history ) {
		return 'normal';
	}
	return testSentAt ? 'just-finished' : 'no-data';
}

/** Host-sent emails are worth a notice only from this share of the range's emails. */
export const FALLBACK_NOTICE_SHARE = 0.05;

/**
 * Failures beat emails the host sent; domain problems and pauses live in the top row instead.
 * Host-sent emails still went out, so a small share of them gets no notice, and none while the
 * Sending card already says the host is sending. The counts are the metric tabs' own.
 *
 * @param stats         - Stats for the period.
 * @param domainFailing - The records don't pass right now.
 * @param paused        - Sending is paused.
 * @return The attention item, or null.
 */
export function attentionFor( stats: Stats, domainFailing = false, paused = false ): Attention {
	const { failed, fallback, emails } = stats.totals;
	if ( failed > 0 ) {
		return { kind: 'failed', count: failed, inLog: stats.attention?.failed_in_log ?? 0 };
	}
	if ( fallback > 0 && fallback >= emails * FALLBACK_NOTICE_SHARE && ! domainFailing && ! paused ) {
		return { kind: 'fallback', count: fallback, inLog: stats.attention?.fallback_in_log ?? 0 };
	}
	return null;
}

/**
 * The site's time format for a whole hour: "6 pm" when it uses a 12-hour clock, "18:00" otherwise.
 *
 * @return A PHP date format.
 */
export function hourFormat(): string {
	const time = getSettings().formats?.time || 'g:i a';
	return /[aA]/.test( time ) ? time.replace( /[:.][is]/g, '' ) : time.replace( /[:.]s/g, '' );
}

/**
 * The real dates under the card title: "Jul 22 – Oct 19, 2026"; "Since 3 pm yesterday" for the
 * last 24 hours; "Since Oct 16" when the site's counts start inside the range.
 *
 * @param stats - The stats.
 * @param today - Site-local today.
 * @return The line.
 */
export function datesLine( stats: Stats, today: string = siteToday() ): string {
	const firstHour = stats.hours[ 0 ];
	if ( stats.range === 1 && firstHour ) {
		const when = parseUtc( firstHour.start );
		const time = dateI18n( hourFormat(), when );
		if ( dateI18n( 'Y-m-d', when ) === today ) {
			/* translators: %s: an hour, e.g. "3 pm". */
			return sprintf( __( 'Since %s today', 'jetpack-send-pkg' ), time );
		}
		/* translators: %s: an hour, e.g. "3 pm". */
		return sprintf( __( 'Since %s yesterday', 'jetpack-send-pkg' ), time );
	}
	const since = stats.stats_since;
	if ( stats.unit === 'day' && since && since > stats.from && since <= stats.to ) {
		return sprintf(
			/* translators: %s: the first day the site's emails were counted, e.g. "Oct 16". */
			__( 'Since %s', 'jetpack-send-pkg' ),
			dayLabel( since, since.slice( 0, 4 ) === today.slice( 0, 4 ) ? 'M j' : 'M j, Y' )
		);
	}
	return rangeDates( stats.from, stats.to );
}

type BucketOptions = {
	/** Phone width: ranges over 31 days draw weeks. */
	narrow?: boolean;
	/** 0 for Sunday … 6 for Saturday. */
	weekStartsOn?: number;
	/** Site-local today. */
	today?: string;
	/** The current time in ms. */
	now?: number;
};

/**
 * The chart's bars: the stats' hours for one day; else its days from the site's first counted day,
 * grouped into weeks past 90 days (past 31 on a phone).
 *
 * @param stats                - The stats.
 * @param options              - Options.
 * @param options.narrow       - Phone width.
 * @param options.weekStartsOn - The site's first day of the week.
 * @param options.today        - Site-local today.
 * @param options.now          - The current time in ms.
 * @return The unit and the bars, oldest first.
 */
export function chartBuckets(
	stats: Stats,
	{ narrow = false, weekStartsOn = 0, today = siteToday(), now = Date.now() }: BucketOptions = {}
): { unit: ChartUnit; buckets: ChartBucket[] } {
	if ( stats.unit === 'hour' ) {
		return {
			unit: 'hour',
			buckets: stats.hours.map( hour => {
				const date = parseUtc( hour.start );
				const start = date.getTime();
				return {
					date,
					start: '',
					end: '',
					sent: hour.sent,
					fallback: hour.fallback,
					failed: hour.failed,
					partial: start <= now && now < start + HOUR_MS,
				};
			} ),
		};
	}
	const trimmed = trimToSince( stats.days, stats.stats_since );
	const days = trimmed.length ? trimmed : stats.days;
	// Day data never draws hours, even when only one day is left after trimming.
	const unit = bucketUnit( Math.max( 2, days.length ), narrow ) === 'week' ? 'week' : 'day';
	const groups =
		unit === 'week'
			? groupByWeek( days, weekStartsOn, today )
			: days.map( day => ( {
					...day,
					start: day.date,
					end: day.date,
					partial: day.date === today,
				} ) );
	return {
		unit,
		buckets: groups.map( group => ( {
			date: localDay( group.start ),
			start: group.start,
			end: group.end,
			sent: group.sent,
			fallback: group.fallback,
			failed: group.failed,
			partial: group.partial,
		} ) ),
	};
}

/**
 * The four metric tabs, always all four so the layout never shifts. Totals are the period's;
 * the series follow the bars.
 *
 * @param stats   - Stats for the period.
 * @param buckets - The chart's bars.
 * @return The metrics, All emails first.
 */
export function metricTabs( stats: Stats, buckets: ChartBucket[] ): Metric[] {
	const series = ( pick: ( bucket: ChartBucket ) => number ) =>
		buckets.map( bucket => ( { date: bucket.date, value: pick( bucket ) } ) );
	return [
		{
			key: 'emails',
			label: __( 'All emails', 'jetpack-send-pkg' ),
			value: stats.totals.emails,
			series: series( bucket => bucket.sent + bucket.fallback + bucket.failed ),
		},
		{
			key: 'sent',
			label: __( 'Sent', 'jetpack-send-pkg' ),
			value: stats.totals.sent,
			series: series( bucket => bucket.sent ),
		},
		{
			key: 'fallback',
			label: __( 'Sent by your host', 'jetpack-send-pkg' ),
			value: stats.totals.fallback,
			series: series( bucket => bucket.fallback ),
		},
		{
			key: 'failed',
			label: __( 'Failed', 'jetpack-send-pkg' ),
			value: stats.totals.failed,
			series: series( bucket => bucket.failed ),
		},
	];
}

/**
 * The bars to label under the chart, counted back from the last so it always has one: every sixth
 * hour; every day of a week (every other on a phone, where seven labels collide), every seventh
 * day up to a month, every fourteenth past it; every fourth week.
 *
 * @param dates  - The bars' dates, oldest first.
 * @param unit   - What a bar stands for.
 * @param narrow - The chart is phone-width.
 * @return The dates to label.
 */
export function chartTicks( dates: Date[], unit: ChartUnit = 'day', narrow = false ): Date[] {
	let step = 4;
	if ( unit === 'hour' ) {
		step = 6;
	} else if ( unit === 'day' && dates.length <= 7 ) {
		step = narrow ? 2 : 1;
	} else if ( unit === 'day' ) {
		step = dates.length <= 31 ? 7 : 14;
	}
	return dates.filter( ( _, index ) => ( dates.length - 1 - index ) % step === 0 );
}

/** The y-axis has at most this many steps above zero. */
const MAX_Y_STEPS = 5;

/**
 * The y-axis: the busiest bar (never under 5, so one email doesn't fill the chart) rounded up to a
 * 1, 2 or 5 step, with a tick at every step, so the top gridline is labelled and the bars stay under it.
 *
 * @param values - Each bar's value.
 * @return The top of the scale and its ticks, from 0.
 */
export function chartScale( values: number[] ): { max: number; ticks: number[] } {
	const busiest = Math.max( 5, ...values );
	const fits = ( size: number ) => Math.ceil( busiest / size ) <= MAX_Y_STEPS;
	let power = 1;
	while ( ! [ 1, 2, 5 ].some( factor => fits( factor * power ) ) ) {
		power *= 10;
	}
	const step = ( [ 1, 2, 5 ].find( factor => fits( factor * power ) ) ?? 1 ) * power;
	const max = Math.ceil( busiest / step ) * step;
	const ticks = Array.from( { length: max / step + 1 }, ( _, i ) => i * step );
	return { max, ticks };
}

/**
 * The y-axis top (see `chartScale`).
 *
 * @param values - Each bar's value.
 * @return The top of the scale.
 */
export function chartMax( values: number[] ): number {
	return chartScale( values ).max;
}

/**
 * A subject without the "[Site title] " WordPress puts in front of its own emails, for short lists.
 *
 * @param subject   - The logged subject.
 * @param siteTitle - The site's title.
 * @return The subject to show.
 */
export function shortSubject( subject: string, siteTitle: string ): string {
	const prefix = siteTitle ? `[${ siteTitle }] ` : '';
	return prefix && subject.startsWith( prefix ) && subject.length > prefix.length
		? subject.slice( prefix.length )
		: subject;
}

/**
 * The later of two logged times.
 *
 * @param a - A time from the API, or null.
 * @param b - Another, or null.
 * @return The newer one, or whichever is set.
 */
export function newestTime( a: string | null, b: string | null ): string | null {
	if ( ! a || ! b ) {
		return a ?? b;
	}
	return parseUtc( a ) >= parseUtc( b ) ? a : b;
}

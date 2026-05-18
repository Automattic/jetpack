import { DATE_RANGE_DAYS } from '../types/stats';
import type { DateRange, Granularity, OverviewStats, StatsSeriesPoint } from '../types/stats';

const NOW_ISO = '2026-05-06T12:00:00Z';
const TOTAL_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

interface RawPoint {
	dateMs: number;
	views: number;
	impressions: number;
	watchSeconds: number;
}

// Per-video base totals calibrated to the full 365-day window. View and
// watch-time bases vary independently so the "Most viewed" and "Top
// videos by watch time" rankings differ — a short explainer can rack up
// views without much watch time; a long tutorial can do the opposite.
const TOP_VIDEOS: Array< {
	id: string;
	title: string;
	baseViews: number;
	baseWatchSeconds: number;
} > = [
	{
		id: 'mock-1',
		title: 'Why We Redesigned Our Blog',
		baseViews: 1427,
		baseWatchSeconds: 42_000,
	},
	{
		id: 'mock-2',
		title: '11 Website Layout Examples for Every Type of Page',
		baseViews: 1065,
		baseWatchSeconds: 18_500,
	},
	{
		id: 'mock-3',
		title: 'Introducing Preview Sites',
		baseViews: 961,
		baseWatchSeconds: 35_800,
	},
	{
		id: 'mock-4',
		title: 'Notice Our New Look? An Update to WordPress.com',
		baseViews: 819,
		baseWatchSeconds: 12_400,
	},
	{
		id: 'mock-5',
		title: 'Safeguard Your Personal Information Online',
		baseViews: 745,
		baseWatchSeconds: 31_200,
	},
	{
		id: 'mock-6',
		title: 'WordCamp Asia 2025: A celebration of Community',
		baseViews: 718,
		baseWatchSeconds: 25_600,
	},
	{
		id: 'mock-7',
		title: 'How to Make a Website',
		baseViews: 456,
		baseWatchSeconds: 22_900,
	},
	{ id: 'mock-8', title: 'Color Accessibility 101', baseViews: 281, baseWatchSeconds: 8_700 },
	{ id: 'mock-9', title: 'Daily vs Real-time Backups', baseViews: 53, baseWatchSeconds: 1_400 },
];

// Deterministic raw daily series for the last 730 days (365 active +
// 365 of historical data the prior-period derivations read from).
// Generated once at module scope via the same `(i * prime) % range`
// idiom fixtures/library.ts uses — no Math.random, no time-of-day.
// Impressions run 3.0–5.4× views to reflect the "loads >> plays"
// shape of the WPCOM video_stats columns.
const RAW_POINTS: RawPoint[] = ( () => {
	const nowMs = new Date( NOW_ISO ).getTime();
	const length = TOTAL_DAYS * 2;
	const out: RawPoint[] = [];
	for ( let i = 0; i < length; i++ ) {
		const dateMs = nowMs - ( length - 1 - i ) * DAY_MS;
		const views = 8 + ( ( i * 17 ) % 42 ) + ( ( i * 7 ) % 13 );
		const impressions = Math.round( views * ( 3.0 + ( ( i * 11 ) % 25 ) / 10 ) );
		const watchSeconds = views * ( 18 + ( ( i * 13 ) % 22 ) );
		out.push( { dateMs, views, impressions, watchSeconds } );
	}
	return out;
} )();

/**
 * One-past-the-last index of the active range inside RAW_POINTS.
 *
 * @return Exclusive end index.
 */
function rangeWindowEnd(): number {
	return RAW_POINTS.length;
}

/**
 * Inclusive start index of the active range inside RAW_POINTS.
 *
 * @param rangeDays - Length of the active range in days.
 * @return Inclusive start index.
 */
function rangeWindowStart( rangeDays: number ): number {
	return rangeWindowEnd() - rangeDays;
}

/**
 * Inclusive start index of the immediately-prior window inside RAW_POINTS.
 *
 * @param rangeDays - Length of the active range in days.
 * @return Inclusive start index of the prior window.
 */
function previousWindowStart( rangeDays: number ): number {
	return rangeWindowStart( rangeDays ) - rangeDays;
}

/**
 * Exclusive end index of the immediately-prior window inside RAW_POINTS.
 * Equals the active range's start so the two windows abut without overlap.
 *
 * @param rangeDays - Length of the active range in days.
 * @return Exclusive end index of the prior window.
 */
function previousWindowEnd( rangeDays: number ): number {
	return rangeWindowStart( rangeDays );
}

/**
 * Sums one numeric field across a half-open RAW_POINTS slice [from, to).
 *
 * @param from  - Inclusive start index.
 * @param to    - Exclusive end index.
 * @param field - Which field on each RawPoint to sum.
 * @return Sum across the slice.
 */
function sumField(
	from: number,
	to: number,
	field: keyof Pick< RawPoint, 'views' | 'impressions' | 'watchSeconds' >
): number {
	let total = 0;
	for ( let i = from; i < to; i++ ) {
		total += RAW_POINTS[ i ][ field ];
	}
	return total;
}

/**
 * Bucket-key for grouping a daily point into the active granularity. Day
 * keys are ISO dates; week keys are the ISO week-start Monday in UTC;
 * month keys are the first-of-month in UTC.
 *
 * @param dateMs      - Milliseconds since epoch.
 * @param granularity - Active bucketing.
 * @return Stable string key for the bucket.
 */
function bucketKey( dateMs: number, granularity: Granularity ): string {
	const d = new Date( dateMs );
	if ( granularity === 'days' ) {
		return d.toISOString().slice( 0, 10 );
	}
	if ( granularity === 'weeks' ) {
		// ISO week start (Monday) in UTC.
		const utcDay = d.getUTCDay() || 7;
		const monday = new Date( d );
		monday.setUTCDate( d.getUTCDate() - ( utcDay - 1 ) );
		return monday.toISOString().slice( 0, 10 );
	}
	return `${ d.getUTCFullYear() }-${ String( d.getUTCMonth() + 1 ).padStart( 2, '0' ) }-01`;
}

/**
 * Buckets daily RAW_POINTS into chart-series points for the active
 * range. Each bucket's `previousPeriodViews` is the same date-shifted
 * point summed into the matching bucket, so prior-period values plot on
 * the same x-axis bucket as the active range.
 *
 * @param rangeDays   - Length of the active range in days.
 * @param granularity - Days / weeks / months bucketing.
 * @return Chart-series points sorted by date ascending.
 */
function buildSeries( rangeDays: number, granularity: Granularity ): StatsSeriesPoint[] {
	const start = rangeWindowStart( rangeDays );
	const end = rangeWindowEnd();
	const buckets = new Map< string, StatsSeriesPoint >();
	for ( let i = start; i < end; i++ ) {
		const point = RAW_POINTS[ i ];
		const priorPoint = RAW_POINTS[ i - rangeDays ];
		const key = bucketKey( point.dateMs, granularity );
		const existing = buckets.get( key );
		if ( existing ) {
			existing.views += point.views;
			existing.impressions += point.impressions;
			existing.watchTimeSeconds += point.watchSeconds;
			existing.previousPeriodViews += priorPoint?.views ?? 0;
			existing.previousPeriodImpressions += priorPoint?.impressions ?? 0;
			existing.previousPeriodWatchTimeSeconds += priorPoint?.watchSeconds ?? 0;
		} else {
			buckets.set( key, {
				date: key,
				views: point.views,
				impressions: point.impressions,
				watchTimeSeconds: point.watchSeconds,
				previousPeriodViews: priorPoint?.views ?? 0,
				previousPeriodImpressions: priorPoint?.impressions ?? 0,
				previousPeriodWatchTimeSeconds: priorPoint?.watchSeconds ?? 0,
			} );
		}
	}
	return Array.from( buckets.values() ).sort( ( a, b ) => a.date.localeCompare( b.date ) );
}

/**
 * Scales a base count to the active range, so a 7-day window shows
 * roughly 1/52 of the 365-day figures. Floors at 1 so cards always
 * render a non-zero count.
 *
 * @param base      - Per-row base value (calibrated to the full 365 days).
 * @param rangeDays - Length of the active range in days.
 * @return Scaled value, at least 1.
 */
function scaleByRange( base: number, rangeDays: number ): number {
	return Math.max( 1, Math.round( base * ( rangeDays / TOTAL_DAYS ) ) );
}

/**
 * Build a fully-populated OverviewStats record for the given date range
 * and granularity. Cheap (one pass over a 365-element window plus a
 * handful of `.map` calls), so we recompute on every settings change
 * rather than memoizing.
 *
 * @param dateRange   - Active range preset.
 * @param granularity - Active series bucketing.
 * @return Stats payload for one render of the Overview screen.
 */
export function generateMockStats( dateRange: DateRange, granularity: Granularity ): OverviewStats {
	const rangeDays = DATE_RANGE_DAYS[ dateRange ];
	const currentStart = rangeWindowStart( rangeDays );
	const currentEnd = rangeWindowEnd();
	const priorStart = previousWindowStart( rangeDays );
	const priorEnd = previousWindowEnd( rangeDays );

	const scaledVideos = TOP_VIDEOS.map( v => ( {
		id: v.id,
		title: v.title,
		views: scaleByRange( v.baseViews, rangeDays ),
		watchTimeSeconds: scaleByRange( v.baseWatchSeconds, rangeDays ),
	} ) );

	return {
		views: {
			current: sumField( currentStart, currentEnd, 'views' ),
			previousPeriod: sumField( priorStart, priorEnd, 'views' ),
		},
		impressions: {
			current: sumField( currentStart, currentEnd, 'impressions' ),
			previousPeriod: sumField( priorStart, priorEnd, 'impressions' ),
		},
		watchTimeSeconds: {
			current: sumField( currentStart, currentEnd, 'watchSeconds' ),
			previousPeriod: sumField( priorStart, priorEnd, 'watchSeconds' ),
		},
		series: buildSeries( rangeDays, granularity ),
		topVideos: [ ...scaledVideos ].sort( ( a, b ) => b.views - a.views ),
		topVideosByWatchTime: [ ...scaledVideos ].sort(
			( a, b ) => b.watchTimeSeconds - a.watchTimeSeconds
		),
	};
}

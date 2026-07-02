import { queryOptions, useQueries, useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { DATE_RANGE_DAYS } from '../types/stats';
import type {
	ActiveMetric,
	ChannelAverages,
	ChartCompare,
	DateRange,
	Granularity,
	KpiSummary,
	OverviewStats,
	StatsSeriesPoint,
	TopVideo,
	VideoStats,
} from '../types/stats';

// Raw WPCOM `sites/{id}/stats/video-plays?complete_stats=true` shape.
// Each day carries a per-period `total` ({ views, impressions,
// watch_time in hours }) and a per-video `data[]` array. Per-video
// entries have `post_id`, `title`, `views`, `impressions`,
// `watch_time` (hours), and `retention_rate`. `plays` is NOT
// returned in complete-stats mode.
type VideoPlayEntry = {
	post_id?: number | string;
	title?: string;
	views?: number;
	impressions?: number;
	watch_time?: number;
	retention_rate?: number;
};

type DayEntry = {
	total?: {
		views?: number;
		impressions?: number;
		watch_time?: number;
	};
	data?: VideoPlayEntry[];
};

type VideoPlaysResponse = {
	date?: string;
	period?: string;
	days?: Record< string, DayEntry >;
};

type StatsQueryParams = {
	num: number;
	date: string; // YYYY-MM-DD, most recent day included
};

const REST_PATH = '/jetpack/v4/videopress/stats/video-plays';
const TOP_VIDEOS_LIMIT = 5;
const ZERO_SUMMARY: KpiSummary = { current: 0, previousPeriod: 0 };

const EMPTY_STATS: OverviewStats = {
	views: ZERO_SUMMARY,
	impressions: ZERO_SUMMARY,
	watchTimeSeconds: ZERO_SUMMARY,
	series: [],
	topVideos: [],
	topVideosByWatchTime: [],
};

const EMPTY_VIDEO_STATS: VideoStats = {
	views: ZERO_SUMMARY,
	impressions: ZERO_SUMMARY,
	watchTimeSeconds: ZERO_SUMMARY,
	retentionRate: ZERO_SUMMARY,
	series: [],
};

const EMPTY_CHANNEL_AVERAGES: ChannelAverages = {
	videoCount: 0,
	views: 0,
	impressions: 0,
	watchTimeSeconds: 0,
	retentionRate: 0,
};

const DEFAULTS = {
	dateRange: 'last_30_days' as DateRange,
	granularity: 'days' as Granularity,
	activeMetric: 'views' as ActiveMetric,
	compare: 'secondary_and_previous_period' as ChartCompare,
};

const COMPARE_FALLBACK_FOR_WATCH_TIME: ChartCompare = 'previous_period';

/**
 * Today's ISO date in UTC (YYYY-MM-DD). Memoized per render of the
 * hook so the two window-param computations agree.
 *
 * @return UTC date string.
 */
function todayIso(): string {
	return new Date().toISOString().slice( 0, 10 );
}

/**
 * Shift an ISO YYYY-MM-DD date by `days` days, in UTC. Negative values
 * shift backward.
 *
 * @param iso  - Base date.
 * @param days - Day delta.
 * @return Shifted date in YYYY-MM-DD.
 */
function shiftIsoDate( iso: string, days: number ): string {
	const ms = Date.parse( `${ iso }T00:00:00Z` ) + days * 86_400_000;
	return new Date( ms ).toISOString().slice( 0, 10 );
}

/**
 * Compute the WPCOM video-plays params for the current and previous
 * windows of equal length. Each window asks WPCOM for `rangeDays` of
 * day-period results, anchored to its most recent day; the two windows
 * abut without overlap.
 *
 * @param rangeDays - Active range length in days.
 * @return Two parameter sets ready to feed `videoPlaysQueryOptions`.
 */
function computeWindows( rangeDays: number ): {
	current: StatsQueryParams;
	previous: StatsQueryParams;
} {
	const today = todayIso();
	return {
		current: { num: rangeDays, date: today },
		previous: { num: rangeDays, date: shiftIsoDate( today, -rangeDays ) },
	};
}

/**
 * TanStack Query options for one `stats/video-plays` window. Server-side
 * forces `complete_stats=true`, so each day entry carries
 * `total.{views,impressions,watch_time}` (watch_time in hours) and a
 * per-video `data[]` array. The `plays` field is not present.
 *
 * @param params - Window parameters.
 * @return queryOptions ready to pass to `useQuery` / `useQueries`.
 */
export function videoPlaysQueryOptions( params: StatsQueryParams ) {
	return queryOptions( {
		queryKey: [ 'jetpack-videopress-stats', 'video-plays', params ],
		queryFn: () =>
			apiFetch< VideoPlaysResponse >( {
				path: addQueryArgs( REST_PATH, { period: 'day', ...params } ),
			} ),
	} );
}

/**
 * Bucket key for grouping a day-keyed entry into the active
 * granularity. Day → ISO date; weeks → ISO Monday in UTC; months →
 * first-of-month in UTC.
 *
 * @param iso         - YYYY-MM-DD date.
 * @param granularity - Active bucketing.
 * @return Stable bucket key string.
 */
function bucketKey( iso: string, granularity: Granularity ): string {
	if ( granularity === 'days' ) {
		return iso;
	}
	const d = new Date( `${ iso }T00:00:00Z` );
	if ( granularity === 'weeks' ) {
		const utcDay = d.getUTCDay() || 7;
		d.setUTCDate( d.getUTCDate() - ( utcDay - 1 ) );
		return d.toISOString().slice( 0, 10 );
	}
	return `${ d.getUTCFullYear() }-${ String( d.getUTCMonth() + 1 ).padStart( 2, '0' ) }-01`;
}

/**
 * Sum the per-day totals for one metric across every day in the
 * response. Days without a `total` block contribute zero.
 *
 * @param response - One `stats/video-plays` response, or undefined.
 * @param field    - Which `total` field to sum.
 * @return Period total.
 */
function sumTotal(
	response: VideoPlaysResponse | undefined,
	field: 'views' | 'impressions' | 'watch_time'
): number {
	if ( ! response?.days ) {
		return 0;
	}
	let total = 0;
	for ( const day of Object.values( response.days ) ) {
		total += day.total?.[ field ] ?? 0;
	}
	return total;
}

/**
 * Aggregate per-video metrics across every day in the response, keyed
 * by `post_id` (falling back to `title` when WPCOM omits the id). Hours
 * → seconds conversion happens at the boundary so consumers see
 * `watchTimeSeconds` accurately.
 *
 * @param response - One `stats/video-plays` response, or undefined.
 * @return Map keyed by stable per-video key → cumulative metrics.
 */
function aggregateTopVideos( response: VideoPlaysResponse | undefined ): Map< string, TopVideo > {
	const acc = new Map< string, TopVideo >();
	if ( ! response?.days ) {
		return acc;
	}
	for ( const day of Object.values( response.days ) ) {
		if ( ! day.data ) {
			continue;
		}
		for ( const entry of day.data ) {
			const id = String( entry.post_id ?? entry.title ?? '' );
			if ( ! id ) {
				continue;
			}
			const views = entry.views ?? 0;
			// WPCOM returns watch_time in hours; convert at boundary so the
			// downstream `watchTimeSeconds` name stays accurate.
			const watch = ( entry.watch_time ?? 0 ) * 3600;
			const existing = acc.get( id );
			if ( existing ) {
				existing.views += views;
				existing.watchTimeSeconds += watch;
			} else {
				acc.set( id, {
					id,
					title: entry.title ?? id,
					views,
					watchTimeSeconds: watch,
				} );
			}
		}
	}
	return acc;
}

/**
 * Build chart-series points from the current and previous responses,
 * aligned to the active granularity. Previous-period values map to the
 * matching current-period bucket by ordinal position (bucket 0 of
 * previous → bucket 0 of current).
 *
 * @param current     - Current-window response.
 * @param previous    - Previous-window response.
 * @param granularity - Active bucketing.
 * @return Sorted series points.
 */
function buildSeries(
	current: VideoPlaysResponse | undefined,
	previous: VideoPlaysResponse | undefined,
	granularity: Granularity
): StatsSeriesPoint[] {
	const currentBuckets = bucketDays( current, granularity );
	const previousBuckets = bucketDays( previous, granularity );
	const previousByIndex = Array.from( previousBuckets.values() );

	const out: StatsSeriesPoint[] = [];
	let index = 0;
	for ( const [ date, bucket ] of currentBuckets ) {
		const prev = previousByIndex[ index ];
		out.push( {
			date,
			views: bucket.views,
			impressions: bucket.impressions,
			watchTimeSeconds: bucket.watchTimeSeconds,
			previousPeriodViews: prev?.views ?? 0,
			previousPeriodImpressions: prev?.impressions ?? 0,
			previousPeriodWatchTimeSeconds: prev?.watchTimeSeconds ?? 0,
		} );
		index += 1;
	}
	return out;
}

type DayBucket = { views: number; impressions: number; watchTimeSeconds: number };

/**
 * Group day-keyed totals into bucketed sums for the active
 * granularity. Returns a Map preserving insertion order so callers can
 * align two responses by ordinal bucket position.
 *
 * @param response    - One `stats/video-plays` response, or undefined.
 * @param granularity - Active bucketing.
 * @return Bucket key → summed metrics.
 */
function bucketDays(
	response: VideoPlaysResponse | undefined,
	granularity: Granularity
): Map< string, DayBucket > {
	const buckets = new Map< string, DayBucket >();
	if ( ! response?.days ) {
		return buckets;
	}
	const sortedDates = Object.keys( response.days ).sort();
	for ( const date of sortedDates ) {
		const day = response.days[ date ];
		const key = bucketKey( date, granularity );
		const existing = buckets.get( key );
		const views = day.total?.views ?? 0;
		const impressions = day.total?.impressions ?? 0;
		const watchTime = ( day.total?.watch_time ?? 0 ) * 3600;
		if ( existing ) {
			existing.views += views;
			existing.impressions += impressions;
			existing.watchTimeSeconds += watchTime;
		} else {
			buckets.set( key, { views, impressions, watchTimeSeconds: watchTime } );
		}
	}
	return buckets;
}

/**
 * Pure transformer that combines the current and previous window
 * responses into the `OverviewStats` shape the Overview screen
 * consumes. Exported separately from `useStats` so the same transform
 * is testable / reusable.
 *
 * @param current     - Current-window response, if loaded.
 * @param previous    - Previous-window response, if loaded.
 * @param granularity - Active series bucketing.
 * @return Stats payload, or `EMPTY_STATS` when both responses are missing.
 */
export function transformVideoPlays(
	current: VideoPlaysResponse | undefined,
	previous: VideoPlaysResponse | undefined,
	granularity: Granularity
): OverviewStats {
	if ( ! current && ! previous ) {
		return EMPTY_STATS;
	}

	const topVideos = Array.from( aggregateTopVideos( current ).values() );

	return {
		views: {
			current: sumTotal( current, 'views' ),
			previousPeriod: sumTotal( previous, 'views' ),
		},
		impressions: {
			current: sumTotal( current, 'impressions' ),
			previousPeriod: sumTotal( previous, 'impressions' ),
		},
		watchTimeSeconds: {
			current: sumTotal( current, 'watch_time' ) * 3600,
			previousPeriod: sumTotal( previous, 'watch_time' ) * 3600,
		},
		series: buildSeries( current, previous, granularity ),
		topVideos: [ ...topVideos ].sort( ( a, b ) => b.views - a.views ).slice( 0, TOP_VIDEOS_LIMIT ),
		topVideosByWatchTime: [ ...topVideos ]
			.sort( ( a, b ) => b.watchTimeSeconds - a.watchTimeSeconds )
			.slice( 0, TOP_VIDEOS_LIMIT ),
	};
}

/**
 * Rewrite a `stats/video-plays` response so each day's `total` block
 * reflects a single video's per-day `data[]` row instead of the
 * site-wide totals. Days where the video has no row are kept with
 * zeroed totals — dropping them would shift the ordinal previous-window
 * alignment `buildSeries` relies on. Rows lacking a `post_id` can never
 * be attributed to a video, so they are skipped rather than matched by
 * title.
 *
 * @param response - One `stats/video-plays` response, or undefined.
 * @param postId   - Video (attachment) post ID to isolate.
 * @return A response of the same shape scoped to that video.
 */
export function filterResponseToVideo(
	response: VideoPlaysResponse | undefined,
	postId: number | string
): VideoPlaysResponse | undefined {
	if ( ! response?.days ) {
		return response;
	}
	const id = String( postId );
	const days: Record< string, DayEntry > = {};
	for ( const [ date, day ] of Object.entries( response.days ) ) {
		const entry = day.data?.find(
			row => row.post_id !== undefined && String( row.post_id ) === id
		);
		days[ date ] = {
			total: {
				views: entry?.views ?? 0,
				impressions: entry?.impressions ?? 0,
				watch_time: entry?.watch_time ?? 0,
			},
			data: entry ? [ entry ] : [],
		};
	}
	return { ...response, days };
}

/**
 * Views-weighted mean of the per-day `retention_rate` values in a
 * response (expects a response already filtered to one video, so each
 * day carries at most one row). Days without a numeric retention_rate
 * are excluded from both numerator and denominator — counting their
 * views would dilute the mean with unobserved days. Zero total weight
 * yields 0 rather than NaN.
 *
 * @param response - A filtered `stats/video-plays` response, or undefined.
 * @return Weighted mean retention rate (same percentage unit WPCOM reports).
 */
function weightedRetentionRate( response: VideoPlaysResponse | undefined ): number {
	if ( ! response?.days ) {
		return 0;
	}
	let weightedSum = 0;
	let totalViews = 0;
	for ( const day of Object.values( response.days ) ) {
		for ( const row of day.data ?? [] ) {
			if ( typeof row.retention_rate !== 'number' ) {
				continue;
			}
			const views = row.views ?? 0;
			weightedSum += row.retention_rate * views;
			totalViews += views;
		}
	}
	return totalViews > 0 ? weightedSum / totalViews : 0;
}

/**
 * Per-video counterpart of `transformVideoPlays`: scopes both windows
 * to one video via `filterResponseToVideo`, reuses the shared
 * totals/series pipeline, and adds a retention KPI (views-weighted mean
 * of the daily `retention_rate` — WPCOM does not expose a per-period
 * retention aggregate, so the client derives one). Top-video lists are
 * meaningless for a single video and are omitted.
 *
 * @param current     - Current-window response, if loaded.
 * @param previous    - Previous-window response, if loaded.
 * @param granularity - Active series bucketing.
 * @param postId      - Video (attachment) post ID to isolate.
 * @return Per-video stats payload, or `EMPTY_VIDEO_STATS` when both responses are missing.
 */
export function transformVideoPlaysForVideo(
	current: VideoPlaysResponse | undefined,
	previous: VideoPlaysResponse | undefined,
	granularity: Granularity,
	postId: number | string
): VideoStats {
	if ( ! current && ! previous ) {
		return EMPTY_VIDEO_STATS;
	}

	const filteredCurrent = filterResponseToVideo( current, postId );
	const filteredPrevious = filterResponseToVideo( previous, postId );
	const base = transformVideoPlays( filteredCurrent, filteredPrevious, granularity );

	return {
		views: base.views,
		impressions: base.impressions,
		watchTimeSeconds: base.watchTimeSeconds,
		retentionRate: {
			current: weightedRetentionRate( filteredCurrent ),
			previousPeriod: weightedRetentionRate( filteredPrevious ),
		},
		series: base.series,
	};
}

/**
 * Per-video means across every video appearing in one video-plays
 * window ("channel average"). Videos are keyed like
 * `aggregateTopVideos` (post_id, falling back to title) so the two
 * aggregations agree on what counts as a video. Count metrics are the
 * window totals divided by the number of distinct videos; retention is
 * the views-weighted mean across every row that reports a numeric
 * `retention_rate` (same exclusion rule as `weightedRetentionRate`).
 * No rows → all-zero averages, never NaN.
 *
 * @param response - One `stats/video-plays` response, or undefined.
 * @return Channel-wide per-video averages for the window.
 */
export function computeChannelAverages(
	response: VideoPlaysResponse | undefined
): ChannelAverages {
	if ( ! response?.days ) {
		return EMPTY_CHANNEL_AVERAGES;
	}
	const videoKeys = new Set< string >();
	let views = 0;
	let impressions = 0;
	let watchTimeHours = 0;
	let weightedRetention = 0;
	let retentionViews = 0;
	for ( const day of Object.values( response.days ) ) {
		for ( const row of day.data ?? [] ) {
			const key = String( row.post_id ?? row.title ?? '' );
			if ( ! key ) {
				continue;
			}
			videoKeys.add( key );
			views += row.views ?? 0;
			impressions += row.impressions ?? 0;
			watchTimeHours += row.watch_time ?? 0;
			if ( typeof row.retention_rate === 'number' ) {
				weightedRetention += row.retention_rate * ( row.views ?? 0 );
				retentionViews += row.views ?? 0;
			}
		}
	}
	const videoCount = videoKeys.size;
	if ( videoCount === 0 ) {
		return EMPTY_CHANNEL_AVERAGES;
	}
	return {
		videoCount,
		views: views / videoCount,
		impressions: impressions / videoCount,
		watchTimeSeconds: ( watchTimeHours * 3600 ) / videoCount,
		retentionRate: retentionViews > 0 ? weightedRetention / retentionViews : 0,
	};
}

/**
 * Channel-average hook for the per-video Analytics screen's comparison
 * card. Issues the identical current-window query as `useVideoStats`
 * (same `videoPlaysQueryOptions` key), so when both hooks are mounted —
 * as they are on that screen — the response is fetched once and shared
 * through the cache; this hook adds no request of its own.
 *
 * @param dateRange - Active range; must match the range passed to `useVideoStats`.
 * @return Channel averages for the current window and loading state.
 */
export function useChannelAverages( dateRange: DateRange = DEFAULTS.dateRange ) {
	const rangeDays = DATE_RANGE_DAYS[ dateRange ];
	const windows = useMemo( () => computeWindows( rangeDays ), [ rangeDays ] );

	const query = useQuery( videoPlaysQueryOptions( windows.current ) );

	const averages = useMemo( () => computeChannelAverages( query.data ), [ query.data ] );

	return {
		averages,
		isLoading: query.isLoading,
	};
}

/**
 * Live-data hook for the Overview tab. Settings live in local React
 * state; data is fetched as two `useQuery` calls (current + previous
 * window) coordinated via `useQueries`.
 *
 * @return Stats state and setters.
 */
export function useStats() {
	const [ dateRange, setDateRange ] = useState< DateRange >( DEFAULTS.dateRange );
	const [ granularity, setGranularity ] = useState< Granularity >( DEFAULTS.granularity );
	const [ activeMetric, setActiveMetricRaw ] = useState< ActiveMetric >( DEFAULTS.activeMetric );
	const [ compare, setCompare ] = useState< ChartCompare >( DEFAULTS.compare );

	const rangeDays = DATE_RANGE_DAYS[ dateRange ];
	const windows = useMemo( () => computeWindows( rangeDays ), [ rangeDays ] );

	const [ currentQuery, previousQuery ] = useQueries( {
		queries: [
			videoPlaysQueryOptions( windows.current ),
			videoPlaysQueryOptions( windows.previous ),
		],
	} );

	const stats = useMemo(
		() => transformVideoPlays( currentQuery.data, previousQuery.data, granularity ),
		[ currentQuery.data, previousQuery.data, granularity ]
	);

	// When Watch time becomes the active metric, `secondary` and
	// `secondary_and_previous_period` no longer make sense (no other
	// metric shares its unit). Fall back to `previous_period`.
	const setActiveMetric = useCallback( ( next: ActiveMetric ) => {
		setActiveMetricRaw( next );
		if ( next === 'watch_time' ) {
			setCompare( prev => ( prev === 'previous_period' ? prev : COMPARE_FALLBACK_FOR_WATCH_TIME ) );
		}
	}, [] );

	return {
		stats,
		isLoading: currentQuery.isLoading || previousQuery.isLoading,
		dateRange,
		granularity,
		activeMetric,
		compare,
		setDateRange,
		setGranularity,
		setActiveMetric,
		setCompare,
	};
}

/**
 * Live-data hook for the per-video Analytics screen. Issues the same
 * two window queries as `useStats` — identical `videoPlaysQueryOptions`
 * keys, so the cache is shared with the Overview and no extra request
 * fires when both screens are visited — and derives the per-video shape
 * with `transformVideoPlaysForVideo`. UI state (date range, metric,
 * compare) is owned by the caller, unlike `useStats`.
 *
 * @param postId      - Video (attachment) post ID to isolate.
 * @param dateRange   - Active range; defaults to the Overview default.
 * @param granularity - Active series bucketing; defaults to days.
 * @return Per-video stats and loading state.
 */
export function useVideoStats(
	postId: number | string,
	dateRange: DateRange = DEFAULTS.dateRange,
	granularity: Granularity = DEFAULTS.granularity
) {
	const rangeDays = DATE_RANGE_DAYS[ dateRange ];
	const windows = useMemo( () => computeWindows( rangeDays ), [ rangeDays ] );

	const [ currentQuery, previousQuery ] = useQueries( {
		queries: [
			videoPlaysQueryOptions( windows.current ),
			videoPlaysQueryOptions( windows.previous ),
		],
	} );

	const stats = useMemo(
		() => transformVideoPlaysForVideo( currentQuery.data, previousQuery.data, granularity, postId ),
		[ currentQuery.data, previousQuery.data, granularity, postId ]
	);

	return {
		stats,
		isLoading: currentQuery.isLoading || previousQuery.isLoading,
	};
}

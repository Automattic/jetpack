export type DateRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_365_days';
export type Granularity = 'days' | 'weeks' | 'months';
export type ActiveMetric = 'views' | 'impressions' | 'watch_time';

// Compare values are metric-agnostic. "secondary" means "the other
// daily-count metric" — Impressions when Views is active, Views when
// Impressions is active. Watch time has no meaningful secondary, so the
// chart offers only `previous_period` there.
export type ChartCompare = 'secondary' | 'previous_period' | 'secondary_and_previous_period';

export interface KpiSummary {
	current: number;
	previousPeriod: number;
}

export interface StatsSeriesPoint {
	date: string;
	views: number;
	impressions: number;
	watchTimeSeconds: number;
	previousPeriodViews: number;
	previousPeriodImpressions: number;
	previousPeriodWatchTimeSeconds: number;
}

export interface TopVideo {
	id: string;
	title: string;
	views: number;
	watchTimeSeconds: number;
}

export interface OverviewStats {
	views: KpiSummary;
	impressions: KpiSummary;
	watchTimeSeconds: KpiSummary;
	series: StatsSeriesPoint[];
	topVideos: TopVideo[];
	topVideosByWatchTime: TopVideo[];
}

// Per-video stats for the Analytics screen. Same series/KPI shapes as
// the Overview so the shared components/stats widgets render unchanged;
// `retentionRate` (a percentage, views-weighted mean of the daily
// retention_rate values WPCOM reports per video) is the one addition.
export interface VideoStats {
	views: KpiSummary;
	impressions: KpiSummary;
	watchTimeSeconds: KpiSummary;
	retentionRate: KpiSummary;
	series: StatsSeriesPoint[];
}

// Sanitized shape of the per-video `stats/video/{post_id}` proxy
// (`/jetpack/v4/videopress/stats/video/{post_id}`). WPCOM returns
// `{ data: [ [ date, plays ], ... ], pages: [ url, ... ] }`; the client
// reshapes the tuples into objects and drops anything malformed.
export interface VideoDailyPlay {
	date: string;
	plays: number;
}

export interface VideoPages {
	dailyPlays: VideoDailyPlay[];
	pages: string[];
}

export const DATE_RANGE_DAYS: Record< DateRange, number > = {
	last_7_days: 7,
	last_30_days: 30,
	last_90_days: 90,
	last_365_days: 365,
};

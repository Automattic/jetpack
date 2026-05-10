export type DateRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_365_days';
export type Granularity = 'days' | 'weeks' | 'months';
export type ActiveMetric = 'views' | 'visitors' | 'watch_time';

// Compare values are metric-agnostic. "secondary" means "the other
// daily-count metric" — Visitors when Views is active, Views when
// Visitors is active. Watch time has no meaningful secondary, so the
// chart offers only `previous_period` there.
export type ChartCompare = 'secondary' | 'previous_period' | 'secondary_and_previous_period';

export interface KpiSummary {
	current: number;
	previousPeriod: number;
}

export interface StatsSeriesPoint {
	date: string;
	views: number;
	visitors: number;
	watchTimeSeconds: number;
	previousPeriodViews: number;
	previousPeriodVisitors: number;
	previousPeriodWatchTimeSeconds: number;
}

export interface TopVideo {
	id: string;
	title: string;
	views: number;
}

export interface TopLocation {
	countryCode: string;
	countryName: string;
	views: number;
}

export interface OverviewStats {
	views: KpiSummary;
	visitors: KpiSummary;
	watchTimeSeconds: KpiSummary;
	series: StatsSeriesPoint[];
	topVideos: TopVideo[];
	topLocations: TopLocation[];
}

export const DATE_RANGE_DAYS: Record< DateRange, number > = {
	last_7_days: 7,
	last_30_days: 30,
	last_90_days: 90,
	last_365_days: 365,
};

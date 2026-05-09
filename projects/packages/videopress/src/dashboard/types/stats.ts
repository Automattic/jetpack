export type DateRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_365_days';
export type Granularity = 'days' | 'weeks' | 'months';
export type ChartCompare = 'visitors' | 'previous_period' | 'visitors_and_previous_period';

export interface KpiSummary {
	current: number;
	previousPeriod: number;
}

export interface StatsSeriesPoint {
	date: string;
	views: number;
	visitors: number;
	previousPeriodViews: number;
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

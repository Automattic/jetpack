/**
 * TypeScript types for the sample data registry
 */

// Data category types for better organization
export type DatasetCategory =
	| 'time-series' // Time-based data (line charts, trends)
	| 'categorical' // Category-based data (bar charts, pie charts)
	| 'comparative' // Comparison data (bar lists, before/after)
	| 'funnel' // Step-by-step conversion data
	| 'performance' // Performance metrics (leaderboards, KPIs)
	| 'geographic'; // Location-based data

export interface SampleDataConfig {
	name: string;
	description: string;
	category: DatasetCategory;
	dataPoints: number;
	suitableFor: string[];
	data: string;
}

/**
 * Sample data quality levels
 */
export type DataQuality = 'demo' | 'realistic' | 'production-like';

/**
 * Extended sample data configuration with quality metadata
 */
export interface ExtendedSampleDataConfig extends SampleDataConfig {
	quality: DataQuality;
	tags: string[];
	dateRange?: {
		start: Date;
		end: Date;
	};
	source?: string;
}

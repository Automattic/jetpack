/**
 * Centralized sample data repository for chart stories
 * Provides reusable, high-quality datasets across all chart components
 */

// Re-export existing sample data from component stories
export { default as olympicMedals } from '../../components/bar-chart/stories/sample-data';
export { default as temperatureData } from '../../components/line-chart/stories/sample-data';
export { default as largeValuesData } from '../../components/line-chart/stories/large-values-sample';
export { default as trafficData } from '../../components/line-chart/stories/site-traffic-sample';
export { sampleData as leaderboardSample } from '../../components/leaderboard-chart/stories/sample-data';
export { sampleFunnelData } from '../../components/conversion-funnel-chart/stories/sample-data';
export { salesByChannel as barListSample } from '../../components/bar-list-chart/stories/sample-data';

// Export types for external use
export type {
	DatasetCategory,
	SampleDataConfig,
	ExtendedSampleDataConfig,
	DataQuality,
} from './types';
import type { SampleDataConfig, DatasetCategory } from './types';

/**
 * Registry of all available sample datasets with metadata
 */
export const sampleDataRegistry: Record< string, SampleDataConfig > = {
	olympicMedals: {
		name: 'Olympic Medals',
		description: 'Historical Olympic medal counts by country (1896-2020)',
		category: 'time-series',
		dataPoints: 2970, // 9 countries × 33 Olympics
		suitableFor: [ 'BarChart', 'LineChart', 'AreaChart' ],
		data: 'olympicMedals',
	},
	temperatureData: {
		name: 'Temperature Data',
		description: 'Weekly temperature readings for multiple cities (2022-2023)',
		category: 'time-series',
		dataPoints: 312, // 3 cities × 104 weeks
		suitableFor: [ 'LineChart', 'AreaChart' ],
		data: 'temperatureData',
	},
	largeValues: {
		name: 'Large Values Dataset',
		description: 'High-scale numeric data for testing large number formatting',
		category: 'time-series',
		dataPoints: 200,
		suitableFor: [ 'LineChart', 'BarChart' ],
		data: 'largeValuesData',
	},
	trafficData: {
		name: 'Website Traffic',
		description: 'Daily website traffic and conversion metrics',
		category: 'time-series',
		dataPoints: 365,
		suitableFor: [ 'LineChart', 'AreaChart' ],
		data: 'trafficData',
	},
	leaderboard: {
		name: 'Performance Leaderboard',
		description: 'Traffic source performance with current vs previous comparisons',
		category: 'performance',
		dataPoints: 8,
		suitableFor: [ 'LeaderboardChart', 'BarChart' ],
		data: 'leaderboardSample',
	},
	conversionFunnel: {
		name: 'E-commerce Funnel',
		description: 'User conversion steps from sessions to purchase',
		category: 'funnel',
		dataPoints: 5,
		suitableFor: [ 'ConversionFunnelChart', 'BarChart' ],
		data: 'sampleFunnelData',
	},
	salesChannels: {
		name: 'Sales Channels',
		description: 'Sales performance by channel with primary vs comparison data',
		category: 'comparative',
		dataPoints: 12,
		suitableFor: [ 'BarListChart', 'BarChart' ],
		data: 'barListSample',
	},
};

/**
 * Get sample data by category
 * @param {DatasetCategory} category - The category to filter by
 * @return {SampleDataConfig[]} Array of sample data configs matching the category
 */
export function getSampleDataByCategory( category: DatasetCategory ): SampleDataConfig[] {
	return Object.values( sampleDataRegistry ).filter( config => config.category === category );
}

/**
 * Get sample data suitable for a specific chart type
 * @param {string} chartType - The chart type to find suitable data for
 * @return {SampleDataConfig[]} Array of sample data configs suitable for the chart type
 */
export function getSampleDataForChart( chartType: string ): SampleDataConfig[] {
	return Object.values( sampleDataRegistry ).filter( config =>
		config.suitableFor.includes( chartType )
	);
}

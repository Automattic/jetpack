/**
 * Centralized sample data repository for chart stories
 * Provides reusable, high-quality datasets across all chart components
 */

import type { SampleDataConfig, DatasetCategory } from './types';

// Re-export types for external use
export type {
	DatasetCategory,
	SampleDataConfig,
	ExtendedSampleDataConfig,
	DataQuality,
} from './types';

/**
 * Olympic medals data for top countries (1896-2020)
 * Total medals (Gold + Silver + Bronze) for Summer Olympics
 */
export const olympicMedals = [
	{
		group: 'United States',
		label: 'United States',
		data: [
			{ label: '1896', value: 20 },
			{ label: '1900', value: 47 },
			{ label: '1904', value: 239 },
			{ label: '1908', value: 47 },
			{ label: '1912', value: 63 },
			{ label: '1920', value: 95 },
			{ label: '1924', value: 99 },
			{ label: '1928', value: 56 },
			{ label: '1932', value: 103 },
			{ label: '1936', value: 56 },
			{ label: '1948', value: 84 },
			{ label: '1952', value: 76 },
			{ label: '1956', value: 74 },
			{ label: '1960', value: 71 },
			{ label: '1964', value: 90 },
			{ label: '1968', value: 107 },
			{ label: '1972', value: 94 },
			{ label: '1976', value: 94 },
			{ label: '1980', value: 0 },
			{ label: '1984', value: 174 },
			{ label: '1988', value: 94 },
			{ label: '1992', value: 108 },
			{ label: '1996', value: 101 },
			{ label: '2000', value: 93 },
			{ label: '2004', value: 101 },
			{ label: '2008', value: 112 },
			{ label: '2012', value: 104 },
			{ label: '2016', value: 121 },
			{ label: '2020', value: 113 },
			{ label: '2024', value: 126 },
		],
	},
	{
		group: 'Great Britain',
		label: 'Great Britain',
		data: [
			{ label: '1896', value: 7 },
			{ label: '1900', value: 30 },
			{ label: '1904', value: 1 },
			{ label: '1908', value: 146 },
			{ label: '1912', value: 41 },
			{ label: '1920', value: 43 },
			{ label: '1924', value: 34 },
			{ label: '1928', value: 25 },
			{ label: '1932', value: 20 },
			{ label: '1936', value: 33 },
			{ label: '1948', value: 23 },
			{ label: '1952', value: 22 },
			{ label: '1956', value: 24 },
			{ label: '1960', value: 20 },
			{ label: '1964', value: 20 },
			{ label: '1968', value: 13 },
			{ label: '1972', value: 21 },
			{ label: '1976', value: 13 },
			{ label: '1980', value: 21 },
			{ label: '1984', value: 37 },
			{ label: '1988', value: 24 },
			{ label: '1992', value: 20 },
			{ label: '1996', value: 15 },
			{ label: '2000', value: 28 },
			{ label: '2004', value: 30 },
			{ label: '2008', value: 47 },
			{ label: '2012', value: 65 },
			{ label: '2016', value: 67 },
			{ label: '2020', value: 65 },
			{ label: '2024', value: 65 },
		],
	},
	{
		group: 'Germany',
		label: 'Germany',
		data: [
			{ label: '1896', value: 13 },
			{ label: '1900', value: 17 },
			{ label: '1904', value: 18 },
			{ label: '1908', value: 16 },
			{ label: '1912', value: 37 },
			{ label: '1920', value: 0 },
			{ label: '1924', value: 30 },
			{ label: '1928', value: 31 },
			{ label: '1932', value: 20 },
			{ label: '1936', value: 101 },
			{ label: '1948', value: 0 },
			{ label: '1952', value: 24 },
			{ label: '1956', value: 26 },
			{ label: '1960', value: 43 },
			{ label: '1964', value: 36 },
			{ label: '1968', value: 39 },
			{ label: '1972', value: 66 },
			{ label: '1976', value: 90 },
			{ label: '1980', value: 126 },
			{ label: '1984', value: 59 },
			{ label: '1988', value: 142 },
			{ label: '1992', value: 82 },
			{ label: '1996', value: 65 },
			{ label: '2000', value: 57 },
			{ label: '2004', value: 49 },
			{ label: '2008', value: 41 },
			{ label: '2012', value: 44 },
			{ label: '2016', value: 42 },
			{ label: '2020', value: 37 },
			{ label: '2024', value: 33 },
		],
	},
];

/**
 * Temperature data for multiple cities
 */
export const temperatureData = [
	{
		group: 'New York',
		label: 'New York',
		data: [
			{ label: 'Jan', value: 2 },
			{ label: 'Feb', value: 3 },
			{ label: 'Mar', value: 8 },
			{ label: 'Apr', value: 14 },
			{ label: 'May', value: 20 },
			{ label: 'Jun', value: 24 },
			{ label: 'Jul', value: 27 },
			{ label: 'Aug', value: 26 },
			{ label: 'Sep', value: 22 },
			{ label: 'Oct', value: 16 },
			{ label: 'Nov', value: 10 },
			{ label: 'Dec', value: 4 },
		],
	},
	{
		group: 'London',
		label: 'London',
		data: [
			{ label: 'Jan', value: 5 },
			{ label: 'Feb', value: 5 },
			{ label: 'Mar', value: 7 },
			{ label: 'Apr', value: 9 },
			{ label: 'May', value: 13 },
			{ label: 'Jun', value: 16 },
			{ label: 'Jul', value: 18 },
			{ label: 'Aug', value: 18 },
			{ label: 'Sep', value: 15 },
			{ label: 'Oct', value: 12 },
			{ label: 'Nov', value: 8 },
			{ label: 'Dec', value: 6 },
		],
	},
	{
		group: 'Tokyo',
		label: 'Tokyo',
		data: [
			{ label: 'Jan', value: 6 },
			{ label: 'Feb', value: 7 },
			{ label: 'Mar', value: 10 },
			{ label: 'Apr', value: 15 },
			{ label: 'May', value: 20 },
			{ label: 'Jun', value: 23 },
			{ label: 'Jul', value: 27 },
			{ label: 'Aug', value: 28 },
			{ label: 'Sep', value: 25 },
			{ label: 'Oct', value: 19 },
			{ label: 'Nov', value: 14 },
			{ label: 'Dec', value: 9 },
		],
	},
];

/**
 * Large values dataset for testing number formatting
 */
export const largeValuesData = [
	{
		group: 'Revenue',
		label: 'Revenue',
		data: [
			{ label: 'Q1', value: 1250000 },
			{ label: 'Q2', value: 1340000 },
			{ label: 'Q3', value: 1180000 },
			{ label: 'Q4', value: 1520000 },
		],
	},
	{
		group: 'Costs',
		label: 'Costs',
		data: [
			{ label: 'Q1', value: 850000 },
			{ label: 'Q2', value: 920000 },
			{ label: 'Q3', value: 780000 },
			{ label: 'Q4', value: 1100000 },
		],
	},
];

/**
 * Daily website traffic data
 */
export const trafficData = [
	{
		group: 'Visitors',
		label: 'Visitors',
		data: [
			{ dateString: '2023-01-01', value: 1000 },
			{ dateString: '2023-01-02', value: 1200 },
			{ dateString: '2023-01-03', value: 950 },
			{ dateString: '2023-01-04', value: 1100 },
			{ dateString: '2023-01-05', value: 1300 },
			{ dateString: '2023-01-06', value: 1150 },
			{ dateString: '2023-01-07', value: 980 },
		],
	},
];

/**
 * Leaderboard sample data
 */
export const leaderboardSample = [
	{
		id: 'direct',
		label: 'Direct',
		currentValue: 12500,
		previousValue: 10000,
		currentShare: 100,
		previousShare: 80,
		delta: 25,
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 70,
		previousShare: 76,
		delta: -7.9,
	},
	{
		id: 'email',
		label: 'Email Marketing',
		currentValue: 6250,
		previousValue: 5800,
		currentShare: 50,
		previousShare: 46,
		delta: 7.8,
	},
	{
		id: 'search',
		label: 'Search Engine',
		currentValue: 4375,
		previousValue: 4200,
		currentShare: 35,
		previousShare: 33,
		delta: 4.2,
	},
];

export const leaderboardSmall = [
	{
		id: 'direct',
		label: 'Direct',
		currentValue: 12500,
		previousValue: 10000,
		currentShare: 100,
		previousShare: 80,
		delta: 25,
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 70,
		previousShare: 76,
		delta: -7.9,
	},
];

export const leaderboardLarge = [
	{
		id: 'large1',
		label: 'Large Value 1',
		currentValue: 1250000,
		previousValue: 1000000,
		currentShare: 100,
		previousShare: 80,
		delta: 25,
	},
	{
		id: 'large2',
		label: 'Large Value 2',
		currentValue: 875000,
		previousValue: 950000,
		currentShare: 70,
		previousShare: 76,
		delta: -7.9,
	},
	{
		id: 'large3',
		label: 'Large Value 3',
		currentValue: 625000,
		previousValue: 580000,
		currentShare: 50,
		previousShare: 46,
		delta: 7.8,
	},
];

export const leaderboardNegativeGrowth = [
	{
		id: 'negative1',
		label: 'Declining Channel',
		currentValue: 5000,
		previousValue: 8000,
		currentShare: 62.5,
		previousShare: 100,
		delta: -37.5,
	},
	{
		id: 'negative2',
		label: 'Another Declining',
		currentValue: 3000,
		previousValue: 6000,
		currentShare: 37.5,
		previousShare: 75,
		delta: -50,
	},
	{
		id: 'negative3',
		label: 'Slight Decline',
		currentValue: 4500,
		previousValue: 4800,
		currentShare: 56.25,
		previousShare: 60,
		delta: -6.25,
	},
];

export const leaderboardWithImageColor = [
	{
		id: 'direct',
		label: 'Direct',
		currentValue: 12500,
		previousValue: 10000,
		currentShare: 100,
		previousShare: 80,
		delta: 25,
		imageColor: '#007aff',
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 30,
		previousShare: 76,
		delta: -7.9,
		imageColor: '#ffc0cb',
	},
	{
		id: 'referral',
		label: 'Referral',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 10,
		previousShare: 16,
		delta: -7.9,
		imageColor: '#00ff00',
	},
];

/**
 * Conversion funnel sample data
 */
export const sampleFunnelData = [
	{
		id: 'sessions',
		label: 'Sessions',
		rate: 100,
		count: 10000,
	},
	{
		id: 'cart',
		label: 'Cart',
		rate: 71.1,
		count: 7110,
	},
	{
		id: 'checkout',
		label: 'Checkout',
		rate: 52.5,
		count: 5250,
	},
	{
		id: 'purchase',
		label: 'Purchase',
		rate: 10.3,
		count: 1030,
	},
];

export const lowConversionData = [
	{
		id: 'sessions',
		label: 'Sessions',
		rate: 100,
		count: 5000,
	},
	{
		id: 'cart',
		label: 'Cart',
		rate: 45.2,
		count: 2260,
	},
	{
		id: 'checkout',
		label: 'Checkout',
		rate: 28.8,
		count: 1440,
	},
	{
		id: 'purchase',
		label: 'Purchase',
		rate: 6.4,
		count: 320,
	},
];

export const highConversionData = [
	{
		id: 'sessions',
		label: 'Sessions',
		rate: 100,
		count: 8000,
	},
	{
		id: 'cart',
		label: 'Cart',
		rate: 85.3,
		count: 6824,
	},
	{
		id: 'checkout',
		label: 'Checkout',
		rate: 72.1,
		count: 5768,
	},
	{
		id: 'purchase',
		label: 'Purchase',
		rate: 18.7,
		count: 1496,
	},
];

/**
 * Bar list chart sample data
 */
export const barListSample = [
	{
		group: 'primary',
		label: 'Jan 21-Aug 8, 2024',
		data: [
			{ label: 'Organic search', value: 30000 },
			{ label: 'Affiliates', value: 19000 },
			{ label: 'Display', value: 18000 },
			{ label: 'Organic shopping', value: 16000 },
		],
	},
	{
		group: 'comparison',
		label: 'Jan 21-Aug 8, 2023',
		data: [
			{ label: 'Organic search', value: 20000 },
			{ label: 'Affiliates', value: 15000 },
			{ label: 'Display', value: 19900 },
			{ label: 'Organic shopping', value: 20500 },
		],
	},
];

export const salesByProduct = [
	{
		group: 'primary',
		label: 'Sales By Product',
		data: [
			{ label: 'Behemoth hat ', value: 32400 },
			{ label: 'Margarita top', value: 20000 },
			{ label: 'Berlioz dress', value: 15000 },
			{ label: 'Woland shirt', value: 16000 },
			{ label: 'Azazello top', value: 20000 },
		],
	},
];

// Pie chart sample data
export const operatingSystemsData = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
		percentage: 23,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
		percentage: 17,
	},
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '80K',
		percentage: 60,
	},
];

// Semi-circle pie chart sample data (different percentages)
export const operatingSystemsSemiCircleData = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
		percentage: 5,
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
		percentage: 1,
	},
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '80K',
		percentage: 2,
	},
];

/**
 * Registry of all available sample datasets with metadata
 */
export const sampleDataRegistry: Record< string, SampleDataConfig > = {
	olympicMedals: {
		name: 'Olympic Medals',
		description: 'Historical Olympic medal counts by country (1896-2020)',
		category: 'time-series',
		dataPoints: 2970,
		suitableFor: [ 'BarChart', 'LineChart', 'AreaChart' ],
		data: 'olympicMedals',
	},
	temperatureData: {
		name: 'Temperature Data',
		description: 'Weekly temperature readings for multiple cities (2022-2023)',
		category: 'time-series',
		dataPoints: 312,
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
		dataPoints: 4,
		suitableFor: [ 'LeaderboardChart', 'BarChart' ],
		data: 'leaderboardSample',
	},
	leaderboardSmall: {
		name: 'Small Leaderboard Dataset',
		description: 'Minimal leaderboard data for testing small datasets',
		category: 'performance',
		dataPoints: 2,
		suitableFor: [ 'LeaderboardChart' ],
		data: 'leaderboardSmall',
	},
	leaderboardLarge: {
		name: 'Large Values Leaderboard',
		description: 'Leaderboard data with large numeric values for formatting tests',
		category: 'performance',
		dataPoints: 3,
		suitableFor: [ 'LeaderboardChart' ],
		data: 'leaderboardLarge',
	},
	leaderboardNegative: {
		name: 'Negative Growth Leaderboard',
		description: 'Leaderboard showing negative growth trends',
		category: 'performance',
		dataPoints: 3,
		suitableFor: [ 'LeaderboardChart' ],
		data: 'leaderboardNegativeGrowth',
	},
	leaderboardWithColors: {
		name: 'Leaderboard with Image Colors',
		description: 'Leaderboard data including custom image colors',
		category: 'performance',
		dataPoints: 3,
		suitableFor: [ 'LeaderboardChart' ],
		data: 'leaderboardWithImageColor',
	},
	conversionFunnel: {
		name: 'E-commerce Funnel',
		description: 'User conversion steps from sessions to purchase',
		category: 'funnel',
		dataPoints: 4,
		suitableFor: [ 'ConversionFunnelChart', 'BarChart' ],
		data: 'sampleFunnelData',
	},
	conversionFunnelLow: {
		name: 'Low Conversion Funnel',
		description: 'Funnel data with lower conversion rates',
		category: 'funnel',
		dataPoints: 4,
		suitableFor: [ 'ConversionFunnelChart' ],
		data: 'lowConversionData',
	},
	conversionFunnelHigh: {
		name: 'High Conversion Funnel',
		description: 'Funnel data with higher conversion rates',
		category: 'funnel',
		dataPoints: 4,
		suitableFor: [ 'ConversionFunnelChart' ],
		data: 'highConversionData',
	},
	salesChannels: {
		name: 'Sales Channels',
		description: 'Sales performance by channel with primary vs comparison data',
		category: 'comparative',
		dataPoints: 8,
		suitableFor: [ 'BarListChart', 'BarChart' ],
		data: 'barListSample',
	},
	salesProducts: {
		name: 'Sales by Product',
		description: 'Product sales performance data for bar list visualization',
		category: 'performance',
		dataPoints: 5,
		suitableFor: [ 'BarListChart', 'BarChart' ],
		data: 'salesByProduct',
	},
	operatingSystems: {
		name: 'Operating Systems',
		description: 'Market share data for different operating systems',
		category: 'categorical',
		dataPoints: 3,
		suitableFor: [ 'PieChart', 'PieSemiCircleChart' ],
		data: 'operatingSystemsData',
	},
	operatingSystemsSemiCircle: {
		name: 'Operating Systems (Semi-Circle)',
		description: 'Market share data optimized for semi-circle pie chart visualization',
		category: 'categorical',
		dataPoints: 3,
		suitableFor: [ 'PieSemiCircleChart', 'PieChart' ],
		data: 'operatingSystemsSemiCircleData',
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

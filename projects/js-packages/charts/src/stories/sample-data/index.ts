/**
 * Centralized sample data repository for chart stories
 * Provides reusable, high-quality datasets across all chart components
 */

import type { FunnelStep } from '../../charts/conversion-funnel-chart';
import type { HeatmapColumn } from '../../charts/heatmap-chart';
import type { LeaderboardEntry } from '../../charts/leaderboard-chart';
import type { DataPointDate, DataPointPercentage, GeoData, SeriesData } from '../../types';

/**
 * Olympic medals data for top countries (1896-2020)
 * Total medals (Gold + Silver + Bronze) for Summer Olympics
 *
 * Historical Olympic medal counts by country (1896-2020)
 * - Category: time-series
 * - Data points: 2970
 * - Suitable for: BarChart, LineChart, AreaChart
 */
export const medalCountsData: SeriesData[] = [
	{
		group: 'united-states',
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
		group: 'great-britain',
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
		group: 'japan',
		label: 'Japan',
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
 * Temperature data for multiple cities - formatted for line charts with proper date objects
 *
 * Weekly temperature readings for multiple cities (2022-2023)
 * - Category: time-series
 * - Data points: 312
 * - Suitable for: LineChart, AreaChart
 */
export const temperatureData: SeriesData[] = [
	{
		group: 'new-york',
		label: 'New York',
		data: [
			{ date: new Date( '2024-01-01' ), value: 2 },
			{ date: new Date( '2024-02-01' ), value: 3 },
			{ date: new Date( '2024-03-01' ), value: 8 },
			{ date: new Date( '2024-04-01' ), value: 14 },
			{ date: new Date( '2024-05-01' ), value: 20 },
			{ date: new Date( '2024-06-01' ), value: 24 },
			{ date: new Date( '2024-07-01' ), value: 27 },
			{ date: new Date( '2024-08-01' ), value: 26 },
			{ date: new Date( '2024-09-01' ), value: 22 },
			{ date: new Date( '2024-10-01' ), value: 16 },
			{ date: new Date( '2024-11-01' ), value: 10 },
			{ date: new Date( '2024-12-01' ), value: 4 },
		],
		options: {},
	},
	{
		group: 'london',
		label: 'London',
		data: [
			{ date: new Date( '2024-01-01' ), value: 5 },
			{ date: new Date( '2024-02-01' ), value: 5 },
			{ date: new Date( '2024-03-01' ), value: 7 },
			{ date: new Date( '2024-04-01' ), value: 9 },
			{ date: new Date( '2024-05-01' ), value: 13 },
			{ date: new Date( '2024-06-01' ), value: 16 },
			{ date: new Date( '2024-07-01' ), value: 18 },
			{ date: new Date( '2024-08-01' ), value: 18 },
			{ date: new Date( '2024-09-01' ), value: 15 },
			{ date: new Date( '2024-10-01' ), value: 12 },
			{ date: new Date( '2024-11-01' ), value: 8 },
			{ date: new Date( '2024-12-01' ), value: 6 },
		],
		options: {},
	},
	{
		group: 'tokyo',
		label: 'Tokyo',
		data: [
			{ date: new Date( '2024-01-01' ), value: 6 },
			{ date: new Date( '2024-02-01' ), value: 7 },
			{ date: new Date( '2024-03-01' ), value: 10 },
			{ date: new Date( '2024-04-01' ), value: 15 },
			{ date: new Date( '2024-05-01' ), value: 20 },
			{ date: new Date( '2024-06-01' ), value: 23 },
			{ date: new Date( '2024-07-01' ), value: 27 },
			{ date: new Date( '2024-08-01' ), value: 28 },
			{ date: new Date( '2024-09-01' ), value: 25 },
			{ date: new Date( '2024-10-01' ), value: 19 },
			{ date: new Date( '2024-11-01' ), value: 14 },
			{ date: new Date( '2024-12-01' ), value: 9 },
		],
		options: {},
	},
	{
		group: 'madrid',
		label: 'Madrid',
		data: [
			{ date: new Date( '2024-01-01' ), value: 8 },
			{ date: new Date( '2024-02-01' ), value: 10 },
			{ date: new Date( '2024-03-01' ), value: 14 },
			{ date: new Date( '2024-04-01' ), value: 16 },
			{ date: new Date( '2024-05-01' ), value: 21 },
			{ date: new Date( '2024-06-01' ), value: 26 },
			{ date: new Date( '2024-07-01' ), value: 29 },
			{ date: new Date( '2024-08-01' ), value: 29 },
			{ date: new Date( '2024-09-01' ), value: 25 },
			{ date: new Date( '2024-10-01' ), value: 18 },
			{ date: new Date( '2024-11-01' ), value: 12 },
			{ date: new Date( '2024-12-01' ), value: 9 },
		],
		options: {},
	},
	{
		group: 'sydney',
		label: 'Sydney',
		data: [
			{ date: new Date( '2024-01-01' ), value: 24 },
			{ date: new Date( '2024-02-01' ), value: 24 },
			{ date: new Date( '2024-03-01' ), value: 22 },
			{ date: new Date( '2024-04-01' ), value: 19 },
			{ date: new Date( '2024-05-01' ), value: 16 },
			{ date: new Date( '2024-06-01' ), value: 13 },
			{ date: new Date( '2024-07-01' ), value: 12 },
			{ date: new Date( '2024-08-01' ), value: 14 },
			{ date: new Date( '2024-09-01' ), value: 17 },
			{ date: new Date( '2024-10-01' ), value: 20 },
			{ date: new Date( '2024-11-01' ), value: 22 },
			{ date: new Date( '2024-12-01' ), value: 24 },
		],
		options: {},
	},
	{
		group: 'moscow',
		label: 'Moscow',
		data: [
			{ date: new Date( '2024-01-01' ), value: -8 },
			{ date: new Date( '2024-02-01' ), value: -6 },
			{ date: new Date( '2024-03-01' ), value: 0 },
			{ date: new Date( '2024-04-01' ), value: 8 },
			{ date: new Date( '2024-05-01' ), value: 16 },
			{ date: new Date( '2024-06-01' ), value: 20 },
			{ date: new Date( '2024-07-01' ), value: 23 },
			{ date: new Date( '2024-08-01' ), value: 21 },
			{ date: new Date( '2024-09-01' ), value: 15 },
			{ date: new Date( '2024-10-01' ), value: 8 },
			{ date: new Date( '2024-11-01' ), value: 2 },
			{ date: new Date( '2024-12-01' ), value: -4 },
		],
		options: {},
	},
	{
		group: 'cairo',
		label: 'Cairo',
		data: [
			{ date: new Date( '2024-01-01' ), value: 15 },
			{ date: new Date( '2024-02-01' ), value: 17 },
			{ date: new Date( '2024-03-01' ), value: 21 },
			{ date: new Date( '2024-04-01' ), value: 26 },
			{ date: new Date( '2024-05-01' ), value: 30 },
			{ date: new Date( '2024-06-01' ), value: 33 },
			{ date: new Date( '2024-07-01' ), value: 35 },
			{ date: new Date( '2024-08-01' ), value: 34 },
			{ date: new Date( '2024-09-01' ), value: 31 },
			{ date: new Date( '2024-10-01' ), value: 27 },
			{ date: new Date( '2024-11-01' ), value: 22 },
			{ date: new Date( '2024-12-01' ), value: 17 },
		],
		options: {},
	},
	{
		group: 'vancouver',
		label: 'Vancouver',
		data: [
			{ date: new Date( '2024-01-01' ), value: 4 },
			{ date: new Date( '2024-02-01' ), value: 6 },
			{ date: new Date( '2024-03-01' ), value: 8 },
			{ date: new Date( '2024-04-01' ), value: 11 },
			{ date: new Date( '2024-05-01' ), value: 15 },
			{ date: new Date( '2024-06-01' ), value: 18 },
			{ date: new Date( '2024-07-01' ), value: 21 },
			{ date: new Date( '2024-08-01' ), value: 22 },
			{ date: new Date( '2024-09-01' ), value: 18 },
			{ date: new Date( '2024-10-01' ), value: 13 },
			{ date: new Date( '2024-11-01' ), value: 8 },
			{ date: new Date( '2024-12-01' ), value: 5 },
		],
		options: {},
	},
];

/**
 * Large values dataset for testing number formatting - formatted for line charts
 *
 * High-scale numeric data for testing large number formatting
 * - Category: time-series
 * - Data points: 200
 * - Suitable for: LineChart, BarChart
 */
export const largeValuesData: SeriesData[] = [
	{
		group: 'revenue',
		label: 'Revenue',
		data: [
			{ date: new Date( '2024-01-01' ), value: 1250000 },
			{ date: new Date( '2024-04-01' ), value: 1340000 },
			{ date: new Date( '2024-07-01' ), value: 1180000 },
			{ date: new Date( '2024-10-01' ), value: 1520000 },
		],
		options: {},
	},
	{
		group: 'costs',
		label: 'Costs',
		data: [
			{ date: new Date( '2024-01-01' ), value: 850000 },
			{ date: new Date( '2024-04-01' ), value: 920000 },
			{ date: new Date( '2024-07-01' ), value: 780000 },
			{ date: new Date( '2024-10-01' ), value: 1100000 },
		],
		options: {},
	},
];

/**
 * Daily website traffic data
 *
 * Daily website traffic and conversion metrics
 * - Category: time-series
 * - Data points: 365
 * - Suitable for: LineChart, AreaChart
 */
export const trafficData: SeriesData[] = [
	{
		group: 'visitors',
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
		options: {},
	},
];

/**
 * Traffic sources leaderboard data
 *
 * Traffic source performance with current vs previous comparisons
 * - Category: performance
 * - Data points: 4
 * - Suitable for: LeaderboardChart, BarChart
 */
export const trafficSourcesData: LeaderboardEntry[] = [
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
	{
		id: 'referral',
		label: 'Referral',
		currentValue: 180,
		previousValue: 150,
		currentShare: 4,
		previousShare: 3,
		delta: 20,
	},
];

/**
 * Minimal leaderboard dataset
 *
 * Minimal leaderboard data for testing small datasets
 * - Category: performance
 * - Data points: 2
 * - Suitable for: LeaderboardChart
 */
export const shortTrafficSourcesData: LeaderboardEntry[] = [
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

/**
 * Large values leaderboard data
 *
 * Leaderboard data with large numeric values for formatting tests
 * - Category: performance
 * - Data points: 3
 * - Suitable for: LeaderboardChart
 */
export const revenueMetricsData: LeaderboardEntry[] = [
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

/**
 * Negative growth leaderboard data
 *
 * Leaderboard showing negative growth trends
 * - Category: performance
 * - Data points: 3
 * - Suitable for: LeaderboardChart
 */
export const decliningMetricsData: LeaderboardEntry[] = [
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

/**
 * Leaderboard data with custom categories
 *
 * Leaderboard data including custom image colors
 * - Category: performance
 * - Data points: 3
 * - Suitable for: LeaderboardChart
 */
export const categorizedMetricsData: LeaderboardEntry[] = [
	{
		id: 'direct',
		label: 'Direct',
		currentValue: 12500,
		previousValue: 10000,
		currentShare: 100,
		previousShare: 80,
		delta: 25,
		imageColor: '#3858E9',
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 30,
		previousShare: 76,
		delta: -7.9,
		imageColor: '#66BDFF',
	},
	{
		id: 'referral',
		label: 'Referral',
		currentValue: 8750,
		previousValue: 9500,
		currentShare: 10,
		previousShare: 16,
		delta: -7.9,
		imageColor: '#8B5CF6',
	},
];

/**
 * E-commerce conversion funnel data
 *
 * User conversion steps from sessions to purchase
 * - Category: funnel
 * - Data points: 4
 * - Suitable for: ConversionFunnelChart, BarChart
 */
export const ecommerceFunnelData: FunnelStep[] = [
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

/**
 * Low conversion funnel data
 *
 * Funnel data with lower conversion rates
 * - Category: funnel
 * - Data points: 4
 * - Suitable for: ConversionFunnelChart
 */
export const lowConversionFunnelData: FunnelStep[] = [
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

/**
 * High conversion funnel data
 *
 * Funnel data with higher conversion rates
 * - Category: funnel
 * - Data points: 4
 * - Suitable for: ConversionFunnelChart
 */
export const highConversionFunnelData: FunnelStep[] = [
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
 * Marketing channels performance data
 *
 * Sales performance by channel with primary vs comparison data
 * - Category: comparative
 * - Data points: 8
 * - Suitable for: BarListChart, BarChart
 */
export const marketingChannelsComparison: SeriesData[] = [
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

/**
 * Marketing channels by country data
 *
 * Sales performance by channel by country
 * - Category: comparative
 * - Data points: 3
 * - Suitable for: BarListChart, BarChart
 */
export const marketingChannelsByCountry: SeriesData[] = [
	{
		group: 'united-states',
		label: 'United States Jan 21-Aug 8, 2024',
		data: [
			{ label: 'Organic search', value: 30000 },
			{ label: 'Affiliates', value: 19000 },
			{ label: 'Display', value: 18000 },
		],
	},
	{
		group: 'great-britain',
		label: 'Great Britain Jan 21-Aug 8, 2023',
		data: [
			{ label: 'Organic search', value: 20000 },
			{ label: 'Affiliates', value: 15000 },
			{ label: 'Display', value: 19900 },
		],
	},
	{
		group: 'japan',
		label: 'Japan Jan 21-Aug 8, 2022',
		data: [
			{ label: 'Organic search', value: 15000 },
			{ label: 'Affiliates', value: 12000 },
			{ label: 'Display', value: 14000 },
		],
	},
];

/**
 * Product sales data
 *
 * Product sales performance data for bar list visualization
 * - Category: performance
 * - Data points: 5
 * - Suitable for: BarListChart, BarChart
 */
export const salesByProduct: SeriesData[] = [
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

/**
 * Operating system usage data
 *
 * Market share data for different operating systems
 * - Category: categorical
 * - Data points: 3
 * - Suitable for: PieChart, PieSemiCircleChart
 */
export const osUsageData: DataPointPercentage[] = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
	},
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '80K',
	},
];

/**
 * Partial operating system usage data
 *
 * Market share data optimized for semi-circle pie chart visualization
 * - Category: categorical
 * - Data points: 3
 * - Suitable for: PieSemiCircleChart, PieChart
 */
export const partialOsUsageData: DataPointPercentage[] = [
	{
		label: 'MacOS',
		value: 30000,
		valueDisplay: '30K',
	},
	{
		label: 'Linux',
		value: 22000,
		valueDisplay: '22K',
	},
	{
		label: 'Windows',
		value: 80000,
		valueDisplay: '80K',
	},
];

/**
 * Global market metrics with comparison data
 *
 * Country-based metrics with current vs comparison period data
 * - Category: time-series comparison
 * - Data points: 6 series (3 countries × 2 periods)
 * - Suitable for: LineChart with comparison types, BarChart
 */
export const globalMarketComparisonByCountry: SeriesData[] = [
	{
		group: 'united-states',
		label: 'United States',
		data: [
			{ date: new Date( '2024-01-01' ), value: 10, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 20, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 15, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 25, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 30, label: 'Jan 5' },
		],
		options: {},
	},
	{
		group: 'united-states',
		label: 'United States comparison',
		data: [
			{ date: new Date( '2024-01-01' ), value: 1, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 2, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 1.5, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 2.5, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 3, label: 'Jan 5' },
		],
		options: {
			type: 'comparison' as const,
		},
	},
	{
		group: 'great-britain',
		label: 'Great Britain',
		data: [
			{ date: new Date( '2024-01-01' ), value: 8, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 12, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 18, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 22, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 28, label: 'Jan 5' },
		],
		options: {},
	},
	{
		group: 'great-britain',
		label: 'Great Britain comparison',
		data: [
			{ date: new Date( '2024-01-01' ), value: 0.8, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 1.2, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 1.8, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 2.2, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 2.8, label: 'Jan 5' },
		],
		options: {
			type: 'comparison' as const,
		},
	},
	{
		group: 'japan',
		label: 'Japan',
		data: [
			{ date: new Date( '2024-01-01' ), value: 5, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 8, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 6, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 12, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 16, label: 'Jan 5' },
		],
		options: {},
	},
	{
		group: 'japan',
		label: 'Japan comparison',
		data: [
			{ date: new Date( '2024-01-01' ), value: 0.5, label: 'Jan 1' },
			{ date: new Date( '2024-01-02' ), value: 0.8, label: 'Jan 2' },
			{ date: new Date( '2024-01-03' ), value: 0.6, label: 'Jan 3' },
			{ date: new Date( '2024-01-04' ), value: 1.2, label: 'Jan 4' },
			{ date: new Date( '2024-01-05' ), value: 1.6, label: 'Jan 5' },
		],
		options: {
			type: 'comparison' as const,
		},
	},
];

/**
 * Customer segmentation revenue data
 *
 * Revenue comparison between new and returning customers
 * - Category: categorical
 * - Data points: 2
 * - Suitable for: PieChart, DonutChart
 */
export const customerRevenueData: DataPointPercentage[] = [
	{
		label: 'New',
		value: 302331.27,
		valueDisplay: '$302.33K',
	},
	{
		label: 'Returning',
		value: 149111.41,
		valueDisplay: '$149.11K',
	},
];

/**
 * Customer segmentation legend data with comparison metrics
 *
 * Extended legend data for customer revenue with growth comparisons
 * - Category: categorical with comparison
 * - Data points: 2
 * - Suitable for: Custom legends with PieChart, DonutChart
 */
export const customerRevenueLegendData = [
	{
		label: 'New',
		value: 302331.27,
		formattedValue: '$302.33K',
		comparison: '14%',
	},
	{
		label: 'Returning',
		value: 149111.41,
		formattedValue: '$149.11K',
		comparison: '133%',
	},
];

/**
 * Orders by country data
 *
 * Orders by country data for geo chart visualization
 * - Category: categorical
 * - Data points: 25
 * - Suitable for: GeoChart
 */
export const viewsByCountry: GeoData = [
	[ 'Country', 'Views' ],
	[ 'United States', 1000 ],
	[ 'United Kingdom', 500 ],
	[ 'Japan', 450 ],
	[ 'Germany', 400 ],
	[ 'France', 350 ],
	[ 'Mexico', 250 ],
	[ 'Brazil', 200 ],
	[ 'India', 150 ],
	[ 'Italy', 120 ],
	[ 'Netherlands', 100 ],
	[ 'Spain', 80 ],
	[ 'Sweden', 40 ],
	[ 'Norway', 30 ],
	[ 'Denmark', 20 ],
	[ 'Finland', 10 ],
	[ 'Ireland', 5 ],
	[ 'Portugal', 3 ],
	[ 'Greece', 2 ],
	[ 'Turkey', 1 ],
	[ 'Egypt', 0.5 ],
	[ 'South Africa', 0.25 ],
	[ 'Nigeria', 0.125 ],
	[ 'Kenya', 0.0625 ],
	[ 'South Korea', 0.03125 ],
];

/**
 * US states views data
 *
 * Views by US state for geo chart visualization
 * - Category: categorical
 * - Data points: 15
 * - Suitable for: GeoChart with region='US' and resolution='provinces'
 */
export const viewsByUSState: GeoData = [
	[ 'State', 'Views' ],
	[ 'California', 2500 ],
	[ 'Texas', 1800 ],
	[ 'Florida', 1500 ],
	[ 'New York', 1400 ],
	[ 'Illinois', 900 ],
	[ 'Pennsylvania', 850 ],
	[ 'Ohio', 750 ],
	[ 'Georgia', 700 ],
	[ 'North Carolina', 650 ],
	[ 'Michigan', 600 ],
	[ 'Washington', 550 ],
	[ 'Arizona', 500 ],
	[ 'Massachusetts', 480 ],
	[ 'Colorado', 450 ],
	[ 'Virginia', 420 ],
];

/**
 * European countries views data
 *
 * Views by European country for geo chart visualization
 * - Category: categorical
 * - Data points: 9
 * - Suitable for: GeoChart with region='150' (Europe)
 */
export const viewsByEuropeanCountry: GeoData = [
	[ 'Country', 'Views' ],
	[ 'United Kingdom', 1500 ],
	[ 'France', 1000 ],
	[ 'Germany', 800 ],
	[ 'Italy', 600 ],
	[ 'Spain', 500 ],
	[ 'Portugal', 400 ],
	[ 'Greece', 300 ],
	[ 'Turkey', 200 ],
	[ 'Russia', 100 ],
];

/**
 * Activity matrix for the heatmap chart (12 columns × 7 rows)
 *
 * Weekday-by-week grid with quarter labels and scattered empty cells.
 * - Category: matrix
 * - Data points: 84
 * - Suitable for: HeatmapChart
 */
export const heatmapActivityMatrix: HeatmapColumn[] = Array.from(
	{ length: 12 },
	( _col, col ) => ( {
		label: col % 4 === 0 ? `Q${ Math.floor( col / 4 ) + 1 }` : '',
		data: Array.from( { length: 7 }, ( _row, row ) => ( {
			label: `Col ${ col + 1 }, Row ${ row + 1 }`,
			value: ( col * 7 + row ) % 5 === 0 ? null : ( ( col + row ) % 5 ) + 1,
		} ) ),
	} )
);

/**
 * Large-value matrix for the heatmap chart (12 columns × 7 rows)
 *
 * Same shape as the activity matrix but with values up to ~1,000,000, to exercise
 * compact in-cell number formatting (e.g. `748.5K`).
 * - Category: matrix
 * - Data points: 84
 * - Suitable for: HeatmapChart
 */
export const heatmapLargeValueMatrix: HeatmapColumn[] = Array.from(
	{ length: 12 },
	( _col, col ) => ( {
		label: col % 4 === 0 ? `Q${ Math.floor( col / 4 ) + 1 }` : '',
		data: Array.from( { length: 7 }, ( _row, row ) => {
			const index = col * 7 + row;
			return {
				label: `Col ${ col + 1 }, Row ${ row + 1 }`,
				value:
					index % 9 === 0 ? null : Math.round( Math.abs( Math.sin( index ) ) * 990_000 ) + 1_000,
			};
		} ),
	} )
);

/**
 * Daily activity series for the calendar heatmap (120 days from 2024-01-01)
 *
 * Date/value pairs for building a GitHub-style contribution calendar via
 * `buildCalendarHeatmapData`.
 * - Category: time-series
 * - Data points: 120
 * - Suitable for: HeatmapChart (calendar layout)
 */
export const heatmapCalendarSeries: DataPointDate[] = Array.from(
	{ length: 120 },
	( _, index ) => ( {
		date: new Date( 2024, 0, 1 + index ),
		value: Math.round( Math.abs( Math.sin( index ) ) * 4 ),
	} )
);

/**
 * Calendar series starting on 2023-06-28 to exercise partial first-month labels.
 *
 * - Category: time-series
 * - Data points: 365
 * - Suitable for: HeatmapChart (calendar layout)
 */
export const heatmapPartialMonthCalendarSeries: DataPointDate[] = Array.from(
	{ length: 365 },
	( _, index ) => ( {
		date: new Date( 2023, 5, 28 + index ),
		value: Math.round( Math.abs( Math.sin( index ) ) * 4 ),
	} )
);

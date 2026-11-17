/**
 * Centralized sample data repository for chart stories
 * Provides reusable, high-quality datasets across all chart components
 */

import type { FunnelStep } from '../../charts/conversion-funnel-chart';
import type { HeatmapCell, HeatmapColumn } from '../../charts/heatmap-chart';
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
 * A week of 921 to 989 views a day: a 7% swing that a fitted axis would draw as empty-to-full bars.
 */
export const steadyTrafficData: SeriesData[] = [
	{
		label: 'Views',
		data: [ 921, 989, 954, 924, 967, 933, 978 ].map( ( value, index ) => ( {
			label: `Sep ${ 12 + index }`,
			value,
		} ) ),
	},
];

const week = ( values: number[] ) =>
	[ 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun' ].map( ( label, index ) => ( {
		label,
		value: values[ index ],
	} ) );

/**
 * Weekly views and visitors, each paired with its previous period
 *
 * Each `type: 'comparison'` series shares its current series' `group`
 * - Category: comparison
 * - Data points: 7 per series
 * - Suitable for: BarChart
 */
export const weeklyComparisonData: SeriesData[] = [
	{ label: 'Views', group: 'views', data: week( [ 420, 580, 310, 750, 640, 380, 290 ] ) },
	{
		label: 'Previous views',
		group: 'views',
		options: { type: 'comparison' },
		data: week( [ 510, 490, 430, 620, 700, 350, 330 ] ),
	},
	{ label: 'Visitors', group: 'visitors', data: week( [ 280, 390, 220, 500, 430, 260, 190 ] ) },
	{
		label: 'Previous visitors',
		group: 'visitors',
		options: { type: 'comparison' },
		data: week( [ 340, 320, 290, 410, 460, 240, 210 ] ),
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
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
	},
	{
		id: 'email',
		label: 'Email Marketing',
		currentValue: 6250,
		previousValue: 5800,
	},
	{
		id: 'search',
		label: 'Search Engine',
		currentValue: 4375,
		previousValue: 4200,
	},
	{
		id: 'referral',
		label: 'Referral',
		currentValue: 180,
		previousValue: 150,
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
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
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
	},
	{
		id: 'large2',
		label: 'Large Value 2',
		currentValue: 875000,
		previousValue: 950000,
	},
	{
		id: 'large3',
		label: 'Large Value 3',
		currentValue: 625000,
		previousValue: 580000,
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
	},
	{
		id: 'negative2',
		label: 'Another Declining',
		currentValue: 3000,
		previousValue: 6000,
	},
	{
		id: 'negative3',
		label: 'Slight Decline',
		currentValue: 4500,
		previousValue: 4800,
	},
];

/**
 * Net sales by source, where refunds push some sources below zero
 *
 * - Category: performance
 * - Data points: 6
 * - Suitable for: LeaderboardChart
 */
export const netSalesBySourceData: LeaderboardEntry[] = [
	{
		id: 'google',
		label: 'Google',
		currentValue: 4200,
		previousValue: 3800,
	},
	{
		id: 'direct',
		label: 'Direct',
		currentValue: 2600,
		previousValue: 2900,
	},
	{
		id: 'paid-search',
		label: 'Paid search',
		currentValue: 1500,
		previousValue: 2200,
	},
	{
		id: 'facebook',
		label: 'Facebook',
		currentValue: 650,
		previousValue: -300,
	},
	{
		id: 'affiliate',
		label: 'Affiliate',
		currentValue: -900,
		previousValue: -400,
	},
	{
		id: 'newsletter',
		label: 'Newsletter',
		currentValue: -1800,
		previousValue: 1200,
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
		imageColor: '#3858E9',
	},
	{
		id: 'social',
		label: 'Social Media',
		currentValue: 8750,
		previousValue: 9500,
		imageColor: '#66BDFF',
	},
	{
		id: 'referral',
		label: 'Referral',
		currentValue: 8750,
		previousValue: 9500,
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
 * Activity matrix with a trailing summary column (13 columns × 7 rows)
 *
 * The activity matrix plus a `Total` column flagged `summary`, holding each
 * row's sum: outside the colour scale, unfilled, emphasised.
 * - Category: matrix
 * - Data points: 91
 * - Suitable for: HeatmapChart (summary column)
 */
export const heatmapActivityMatrixWithTotals: HeatmapColumn[] = [
	...heatmapActivityMatrix,
	{
		label: 'Total',
		summary: true,
		data: Array.from( { length: 7 }, ( _row, row ) => ( {
			label: `Total, Row ${ row + 1 }`,
			value: heatmapActivityMatrix.reduce(
				( sum, column ) => sum + ( column.data[ row ].value ?? 0 ),
				0
			),
		} ) ),
	},
];

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

export const HEATMAP_POSTS_RANGE = { start: '2025-10-01', end: '2026-09-14' };

/**
 * Posts per day over the twelve months to 2026-09-14, sparse like `stats/streak`.
 *
 * - Category: day-keyed map
 * - Data points: ~140 days with posts, 1 to 4 each
 * - Suitable for: HeatmapChart (month calendar layout)
 */
export const heatmapPostsByDay: Record< string, number > = Object.fromEntries(
	Array.from( { length: 349 }, ( _, index ) => {
		const day = new Date( Date.UTC( 2025, 9, 1 + index ) );
		const wave = Math.abs( Math.sin( index * 1.7 ) );
		const posts = wave > 0.8 ? Math.ceil( ( wave - 0.8 ) * 20 ) : 0;
		return [ day.toISOString().slice( 0, 10 ), posts ];
	} ).filter( ( [ , posts ] ) => Number( posts ) > 0 )
);

const MONTH_LABELS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];

/**
 * Lay months out as twelve columns with one row per year.
 *
 * @param years   - The years, one per row.
 * @param cellFor - The cell for a month, or `null` for a month outside the covered span.
 * @return One column per month; uncovered months are placeholder cells.
 */
const monthColumns = (
	years: number[],
	cellFor: ( year: number, month: number ) => HeatmapCell | null
): HeatmapColumn[] =>
	MONTH_LABELS.map( ( label, month ) => ( {
		label,
		data: years.map( year => ( {
			label: `${ label } ${ year }`,
			...( cellFor( year, month ) ?? { value: null, placeholder: true } ),
		} ) ),
	} ) );

const monthValues = ( year: number, values: number[], firstMonth = 0 ): Record< string, number > =>
	Object.fromEntries(
		values.map( ( value, index ) => [ `${ year }-${ firstMonth + index }`, value ] )
	);

const hashFraction = ( seed: number ) => Math.abs( Math.sin( seed * 12.9898 ) * 43758.5453 ) % 1;

const jitter = ( seed: number ) => 0.85 + 0.3 * hashFraction( seed );

// Newest first, as the Views over years widget draws them.
const LONG_HISTORY_YEARS = [
	2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011,
];

// Launched in February 2011 and grown over sixteen years: a climb through 2018, a peak in April
// 2020, a long decline, and November 2026 still running.
const LONG_HISTORY_VIEWS: Record< string, number > = {
	...monthValues(
		2011,
		[ 195, 118_400, 36_800, 19_100, 29_400, 40_600, 50_200, 56_900, 46_800, 59_300, 50_800 ],
		1
	),
	...monthValues(
		2012,
		[
			62_100, 58_200, 68_600, 72_400, 71_500, 80_700, 113_800, 122_900, 93_100, 111_200, 179_400,
			148_600,
		]
	),
	...monthValues(
		2013,
		[
			224_300, 205_700, 225_200, 226_100, 215_300, 204_800, 211_400, 218_500, 234_200, 233_900,
			225_300, 223_700,
		]
	),
	...monthValues(
		2014,
		[
			253_700, 259_100, 279_600, 305_300, 278_000, 257_500, 269_800, 350_700, 400_200, 383_400,
			328_000, 312_200,
		]
	),
	...monthValues(
		2015,
		[
			352_300, 319_600, 374_500, 389_600, 380_800, 330_400, 333_400, 311_600, 326_600, 368_800,
			441_100, 375_000,
		]
	),
	...monthValues(
		2016,
		[
			385_300, 367_500, 358_700, 352_300, 343_400, 289_900, 264_200, 286_200, 369_200, 371_100,
			352_800, 319_700,
		]
	),
	...monthValues(
		2017,
		[
			439_400, 402_400, 456_200, 506_500, 481_200, 479_100, 442_000, 470_300, 460_500, 512_600,
			513_300, 469_900,
		]
	),
	...monthValues(
		2018,
		[
			573_000, 566_700, 591_900, 538_900, 620_500, 518_900, 547_000, 567_300, 513_300, 508_500,
			529_500, 484_900,
		]
	),
	...monthValues(
		2019,
		[
			563_300, 501_200, 569_700, 502_100, 516_600, 447_100, 442_800, 436_500, 426_800, 428_300,
			451_000, 408_900,
		]
	),
	...monthValues(
		2020,
		[
			443_500, 461_700, 550_100, 801_700, 712_400, 656_100, 570_400, 774_400, 470_600, 401_400,
			384_400, 360_500,
		]
	),
	...monthValues(
		2021,
		[
			370_400, 344_500, 398_900, 373_200, 335_400, 314_500, 320_100, 332_500, 319_400, 296_100,
			293_300, 274_600,
		]
	),
	...monthValues(
		2022,
		[
			356_400, 306_000, 310_600, 319_700, 388_500, 359_800, 328_100, 373_800, 334_700, 315_700,
			367_500, 376_600,
		]
	),
	...monthValues(
		2023,
		[
			562_300, 477_000, 498_400, 435_700, 416_800, 357_900, 355_500, 347_500, 314_200, 388_200,
			355_200, 341_800,
		]
	),
	...monthValues(
		2024,
		[
			398_200, 366_700, 366_700, 357_300, 366_800, 302_400, 344_400, 375_900, 367_700, 338_300,
			317_600, 256_800,
		]
	),
	...monthValues(
		2025,
		[
			252_100, 209_600, 230_200, 218_900, 226_700, 224_400, 205_600, 192_300, 247_000, 253_800,
			442_500, 338_900,
		]
	),
	...monthValues(
		2026,
		[
			209_100, 175_800, 613_400, 218_800, 175_700, 183_200, 214_600, 209_700, 217_000, 302_100,
			104_800,
		]
	),
};

const longHistoryMonths = monthColumns( LONG_HISTORY_YEARS, ( year, month ) => {
	const key = `${ year }-${ month }`;
	if ( ! ( key in LONG_HISTORY_VIEWS ) ) {
		return null;
	}
	return { value: LONG_HISTORY_VIEWS[ key ], partial: key === '2011-1' || key === '2026-10' };
} );

/**
 * A site's views by month over sixteen years, with a trailing yearly total.
 *
 * The "Views over years" shape at its hardest: a launch month of 195 views four orders of
 * magnitude below the peak, a first year in the tens of thousands, and thirteen years that
 * all sit between 200,000 and 600,000. The launch month and the current month are partial.
 * - Category: matrix
 * - Data points: 190 months over 16 rows, plus a summary column
 * - Suitable for: HeatmapChart (comparing color scales on a real distribution)
 */
export const heatmapViewsOverYears: { rowLabels: string[]; data: HeatmapColumn[] } = {
	rowLabels: LONG_HISTORY_YEARS.map( String ),
	data: [
		...longHistoryMonths,
		{
			label: 'Totals',
			summary: true,
			data: LONG_HISTORY_YEARS.map( ( year, row ) => ( {
				label: `Total ${ year }`,
				value: longHistoryMonths.reduce(
					( sum, column ) => sum + ( column.data[ row ].value ?? 0 ),
					0
				),
			} ) ),
		},
	],
};

const SINGLE_POST_HISTORY_YEARS = [ 2024, 2025 ];

// Published in October 2024, one spike in January 2025, November 2025 still running.
const SINGLE_POST_VIEWS: Record< string, number > = {
	'2024-9': 85,
	'2024-10': 140,
	'2024-11': 96,
	'2025-0': 9400,
	'2025-1': 310,
	'2025-2': 180,
	'2025-3': 150,
	'2025-4': 120,
	'2025-5': 95,
	'2025-6': 88,
	'2025-7': 110,
	'2025-8': 70,
	'2025-9': 82,
	'2025-10': 41,
};

/**
 * One post's views by month over the fourteen months since it was published.
 *
 * One spike sits two orders of magnitude above the rest. The publish month and the current
 * month are partial; the months outside that span are placeholders.
 * - Category: matrix
 * - Data points: 14 months over 2 rows
 * - Suitable for: HeatmapChart (log scale)
 */
export const heatmapPostHistory: { rowLabels: string[]; data: HeatmapColumn[] } = {
	rowLabels: SINGLE_POST_HISTORY_YEARS.map( String ),
	data: monthColumns( SINGLE_POST_HISTORY_YEARS, ( year, month ) => {
		const key = `${ year }-${ month }`;
		if ( ! ( key in SINGLE_POST_VIEWS ) ) {
			return null;
		}
		return { value: SINGLE_POST_VIEWS[ key ], partial: key === '2024-9' || key === '2025-10' };
	} ),
};

const SCALE_COMPARISON_YEARS = [ 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 ];

const SCALE_COMPARISON_VIEWS: Record< string, number > = {
	...monthValues( 2017, [ 4, 21, 33, 19, 7, 12, 11, 15, 8, 3, 16, 22 ] ),
	...monthValues( 2018, [ 7, 5, 14, 9, 11, 6, 15, 8, 4, 6, 2, 5 ] ),
	...monthValues( 2019, [ 9, 7, 4, 15, 18, 13, 6, 5, 2, 28, 9, 11 ] ),
	...monthValues( 2020, [ 6, 9, 8, 3, 12, 640, 11, 2900, 8, 18, 14, 12 ] ),
	...monthValues( 2021, [ 21, 11, 16, 5, 7, 4, 11, 9, 2, 3, 5, 6 ] ),
	...monthValues( 2022, [ 12, 10, 9, 8, 6, 5, 7, 910, 205, 9, 4, 7 ] ),
	...monthValues( 2023, [ 8, 13, 5, 4, 7, 6, 3, 5, 9, 3, 2, 27 ] ),
	...monthValues( 2024, [ 16, 6, 5, 58, 230, 7, 14, 2, 1, 3, 9, 19 ] ),
	...monthValues( 2025, [ 0, 6, 3, 2, 19, 5, 275, 221, 1700, 2300, 11400, 10600 ] ),
	...monthValues( 2026, [ 9800, 7100, 1500, 4200, 2800, 2400, 3100, 1900, 1400, 2600, 820 ] ),
};

/**
 * One post's views by month over ten years, running from single digits to five figures.
 *
 * The shape a distance scale flattens everywhere below its spike: eight quiet years, then
 * the post catches on. The current month is partial.
 * - Category: matrix
 * - Data points: 119 months over 10 rows
 * - Suitable for: HeatmapChart (comparing the linear and log scales)
 */
export const heatmapScaleComparison: { rowLabels: string[]; data: HeatmapColumn[] } = {
	rowLabels: SCALE_COMPARISON_YEARS.map( String ),
	data: monthColumns( SCALE_COMPARISON_YEARS, ( year, month ) => {
		const key = `${ year }-${ month }`;
		if ( ! ( key in SCALE_COMPARISON_VIEWS ) ) {
			return null;
		}
		return { value: SCALE_COMPARISON_VIEWS[ key ], partial: key === '2026-10' };
	} ),
};

// A mid-week span (Wed to Wed) so both calendar edges are ragged. Sliced once, not per
// render, since `useCalendarHeatmapData` holds the series by reference.
const raggedCalendarSeries = heatmapCalendarSeries.slice( 2, 115 );

const calendarSeriesFrom = ( valueFor: ( dayIndex: number ) => number ): DataPointDate[] =>
	raggedCalendarSeries.map( ( { date }, dayIndex ) => ( { date, value: valueFor( dayIndex ) } ) );

const GROWTH_WEEKLY_SEASONALITY = [ 1.15, 1.05, 1, 0.95, 0.9, 0.8, 1.05 ];

const CALENDAR_VALUE_STEPS = [ 4, 30, 120, 900 ];

/**
 * Five traffic shapes over the same 113 days, for reading a color scale against each.
 *
 * - Category: time-series
 * - Data points: 113 days per shape
 * - Suitable for: HeatmapChart (calendar layout)
 */
export const heatmapCalendarDatasets: Record< string, DataPointDate[] > = {
	'Steady traffic': raggedCalendarSeries,
	'Publication spike and decay': calendarSeriesFrom( day =>
		Math.round( 500 * 0.45 ** day + 4 * jitter( day ) )
	),
	'Gradual growth': calendarSeriesFrom( day =>
		Math.round( ( 20 + day * 1.6 ) * GROWTH_WEEKLY_SEASONALITY[ day % 7 ] * jitter( day + 500 ) )
	),
	'A few distinct values': calendarSeriesFrom(
		day => CALENDAR_VALUE_STEPS[ Math.floor( hashFraction( day ) * CALENDAR_VALUE_STEPS.length ) ]
	),
	// Days 54 to 60 fill one whole column while weeks start on Monday, so the busy week reads as one.
	'One busy week': calendarSeriesFrom( day =>
		Math.round( ( day >= 54 && day <= 60 ? 140 : 18 ) * jitter( day ) )
	),
};

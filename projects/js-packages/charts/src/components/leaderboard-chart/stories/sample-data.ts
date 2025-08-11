import type { LeaderboardEntry } from '../leaderboard-chart';

export const sampleData: LeaderboardEntry[] = [
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

export const smallDataset: LeaderboardEntry[] = [
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

export const largeValues: LeaderboardEntry[] = [
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

export const negativeGrowth: LeaderboardEntry[] = [
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

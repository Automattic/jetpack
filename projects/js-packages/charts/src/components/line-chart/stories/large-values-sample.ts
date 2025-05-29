import type { SeriesData } from '../../../types';

// Sample data with large values to demonstrate Smart Formatting (formatYTick)
const largeValuesData: SeriesData[] = [
	{
		label: 'Revenue (Billions)',
		data: [
			{ date: new Date( '2024-01-01' ), value: 1200000000 }, // 1.2G
			{ date: new Date( '2024-02-01' ), value: 1450000000 }, // 1.45G
			{ date: new Date( '2024-03-01' ), value: 1680000000 }, // 1.68G
			{ date: new Date( '2024-04-01' ), value: 2100000000 }, // 2.1G
			{ date: new Date( '2024-05-01' ), value: 2350000000 }, // 2.35G
			{ date: new Date( '2024-06-01' ), value: 2800000000 }, // 2.8G
		],
		options: {
			stroke: '#3858E9',
		},
	},
	{
		label: 'Users (Millions)',
		data: [
			{ date: new Date( '2024-01-01' ), value: 45000000 }, // 45M
			{ date: new Date( '2024-02-01' ), value: 52000000 }, // 52M
			{ date: new Date( '2024-03-01' ), value: 48000000 }, // 48M
			{ date: new Date( '2024-04-01' ), value: 61000000 }, // 61M
			{ date: new Date( '2024-05-01' ), value: 75000000 }, // 75M
			{ date: new Date( '2024-06-01' ), value: 89000000 }, // 89M
		],
		options: {
			stroke: '#00BA37',
		},
	},
];

export default largeValuesData;

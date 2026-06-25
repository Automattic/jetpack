/**
 * Actual API shape returned by stats/devices/{property}.
 * Both summarized and non-summarized requests return { top_values: [...] }.
 */
export const devicesFixture = {
	date: '2026-06-25',
	period: 'day',
	top_values: [
		{ label: 'Desktop', value: 1000 },
		{ label: 'Mobile', value: 800 },
		{ label: 'Tablet', value: 90 },
	],
};

export const devicesEmptyFixture = {
	date: '2026-06-25',
	period: 'day',
	top_values: [],
};

/**
 * Actual API shape returned by stats/devices/{property}.
 * top_values is a plain object (dict), not an array.
 */
export const devicesFixture = {
	date: '2026-06-25',
	period: 'day',
	top_values: {
		desktop: 1000,
		mobile: 800,
		tablet: 90,
	},
};

export const devicesEmptyFixture = {
	date: '2026-06-25',
	period: 'day',
	top_values: {},
};

export const devicesBrowserFixture = {
	date: '2026-06-25',
	period: 'day',
	top_values: {
		chrome: 500,
		safari: 300,
		firefox: 100,
	},
};

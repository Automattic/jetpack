/**
 * Actual API shape returned by stats/devices/{property}.
 * top_values is a plain object (dict), not an array. Values are percentage shares.
 */
export const devicesFixture = {
	date: '2026-06-25',
	period: 'day',
	top_values: {
		desktop: 85.9,
		mobile: 13.5,
		tablet: 0.5,
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
		chrome: 54.7,
		safari: 27.2,
		firefox: 9.8,
	},
};

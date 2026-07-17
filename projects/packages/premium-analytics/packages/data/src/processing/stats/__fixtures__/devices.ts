/**
 * Actual API shape returned by stats/devices/{property}.
 * top_values is a plain object (dict), not an array.
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
		chrome: 29451,
		safari: 3407,
		other: 2721,
		edge: 1823,
		firefox: 1444,
	},
};

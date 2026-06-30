import type { StatsDevicesResponse } from '../devices';

export const devicesScreenSizeFixture = {
	top_values: {
		mobile: 9,
		desktop: 4,
		tablet: 2,
	},
} satisfies StatsDevicesResponse;

export const devicesBrowserFixture = {
	top_values: {
		chrome: 9,
		safari: 4,
		ie: 1,
	},
} satisfies StatsDevicesResponse;

export const devicesPlatformFixture = {
	top_values: {
		ios: 9,
		android: 4,
		ipad: 1,
	},
} satisfies StatsDevicesResponse;

export const devicesEmptyFixture = {
	top_values: [],
} satisfies StatsDevicesResponse;

export const devicesZeroValueFixture = {
	top_values: {
		mobile: 0,
		desktop: 4,
	},
} satisfies StatsDevicesResponse;

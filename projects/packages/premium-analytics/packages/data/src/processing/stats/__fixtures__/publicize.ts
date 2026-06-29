import type { StatsPublicizeApiResponse } from '../publicize';

export const publicizeFixture = {
	services: [
		{
			service: 'twitter',
			followers: '12',
		},
		{
			service: 'facebook',
			followers: 8,
		},
	],
} satisfies StatsPublicizeApiResponse;

export const publicizeUnknownServiceFixture = {
	services: [
		{
			service: 'mastodon',
			followers: '3',
		},
	],
} satisfies StatsPublicizeApiResponse;

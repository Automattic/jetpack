import { sanitizeStatsPublicizeResponse } from '..';
import { publicizeFixture, publicizeUnknownServiceFixture } from '../__fixtures__/publicize';

describe( 'Stats publicize normalizer', () => {
	it( 'normalizes raw publicize service rows', () => {
		expect( sanitizeStatsPublicizeResponse( publicizeFixture ) ).toEqual( {
			summary: {
				total: 20,
			},
			data: [
				{
					time_interval: '',
					date_start: '',
					date_end: '',
					items: [
						{
							service: 'twitter',
							label: 'Twitter',
							followers: 12,
							value: 12,
							icon: 'https://secure.gravatar.com/blavatar/7905d1c4e12c54933a44d19fcd5f9356?s=48',
							children: null,
						},
						{
							service: 'facebook',
							label: 'Facebook',
							followers: 8,
							value: 8,
							icon: 'https://secure.gravatar.com/blavatar/2343ec78a04c6ea9d80806345d31fd78?s=48',
							children: null,
						},
					],
				},
			],
		} );
	} );

	it( 'uses the service slug when Calypso has no service metadata', () => {
		expect(
			sanitizeStatsPublicizeResponse( publicizeUnknownServiceFixture ).data[ 0 ].items[ 0 ]
		).toEqual( {
			service: 'mastodon',
			label: 'mastodon',
			followers: 3,
			value: 3,
			icon: null,
			children: null,
		} );
	} );

	it( 'returns an empty report for missing services', () => {
		expect( sanitizeStatsPublicizeResponse( {} ) ).toEqual( {
			summary: {},
			data: [],
		} );
	} );
} );

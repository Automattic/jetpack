import { sanitizeStatsPublicizeResponse } from '..';
import { publicizeFixture } from '../__fixtures__/publicize';

describe( 'Stats publicize normalizer', () => {
	it( 'normalizes publicize service rows', () => {
		expect( sanitizeStatsPublicizeResponse( publicizeFixture ).data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'mastodon',
				followers: 12,
			} )
		);
	} );
} );

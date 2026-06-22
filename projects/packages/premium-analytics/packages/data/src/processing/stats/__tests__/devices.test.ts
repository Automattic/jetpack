import { sanitizeStatsDevicesResponse } from '..';
import { devicesFixture } from '../__fixtures__/devices';

describe( 'Stats devices normalizer', () => {
	it( 'normalizes summarized device top-value payloads as leaderboard rows', () => {
		expect( sanitizeStatsDevicesResponse( devicesFixture ).data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				key: 'mobile',
				label: 'mobile',
				views: 9,
			} ),
			expect.objectContaining( {
				key: 'desktop',
				label: 'desktop',
				views: 4,
			} ),
		] );
	} );
} );

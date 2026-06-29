import { sanitizeStatsVisitsResponse } from '..';
import { visitsFixture } from '../__fixtures__/time-series';

describe( 'Stats visits normalizer', () => {
	it( 'normalizes visits through the time-series processor', () => {
		expect( sanitizeStatsVisitsResponse( visitsFixture, { period: 'day' } ).data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-15',
				views: 8,
				visitors: 3,
			} )
		);
	} );
} );

import { sanitizeStatsStreakResponse } from '..';
import { streakFixture } from '../__fixtures__/streak';

describe( 'Stats streak normalizer', () => {
	it( 'normalizes timestamp counts into date buckets', () => {
		expect( sanitizeStatsStreakResponse( streakFixture ) ).toEqual( {
			'2016-04-29': 2,
			'2016-04-30': 1,
		} );
	} );

	it( 'applies the site GMT offset before bucketing counts', () => {
		expect( sanitizeStatsStreakResponse( streakFixture, { gmtOffset: 10 } ) ).toEqual( {
			'2016-04-29': 1,
			'2016-04-30': 1,
			'2016-05-01': 1,
		} );
		expect( sanitizeStatsStreakResponse( streakFixture, { gmtOffset: -10 } ) ).toEqual( {
			'2016-04-28': 1,
			'2016-04-29': 1,
			'2016-04-30': 1,
		} );
	} );

	it( 'preserves fractional site GMT offsets', () => {
		expect(
			sanitizeStatsStreakResponse( { data: { 1461955500: 1 } }, { gmtOffset: 5.5 } )
		).toEqual( {
			'2016-04-30': 1,
		} );
	} );

	it( 'returns an empty response for malformed data', () => {
		expect( sanitizeStatsStreakResponse( { data: [ 1461889800 ] } ) ).toEqual( {} );
	} );
} );

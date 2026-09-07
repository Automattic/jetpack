import { sanitizeStatsStreakResponse } from '..';
import { streakFixture } from '../__fixtures__/streak';
import type { StatsSanitizerParams } from '../../../utils/stats-params';

const inZone = ( timezone: string ) => ( { timezone } ) as StatsSanitizerParams;

describe( 'Stats streak normalizer', () => {
	it( 'normalizes timestamp counts into date buckets', () => {
		expect( sanitizeStatsStreakResponse( streakFixture, inZone( 'UTC' ) ) ).toEqual( {
			'2016-04-29': 2,
			'2016-04-30': 1,
		} );
	} );

	it( 'buckets by the report calendar day, not the UTC one', () => {
		// The fixture's later timestamps are 23:30 UTC, so an India site has already
		// turned the page on both of them.
		expect( sanitizeStatsStreakResponse( streakFixture, inZone( 'Asia/Kolkata' ) ) ).toEqual( {
			'2016-04-29': 1,
			'2016-04-30': 1,
			'2016-05-01': 1,
		} );

		expect( sanitizeStatsStreakResponse( streakFixture, inZone( 'America/New_York' ) ) ).toEqual( {
			'2016-04-28': 1,
			'2016-04-29': 1,
			'2016-04-30': 1,
		} );
	} );

	it( 'buckets a half-hour zone by its own midnight', () => {
		// 2016-04-29 18:45 UTC is 00:15 the next day in India.
		expect(
			sanitizeStatsStreakResponse( { data: { 1461955500: 1 } }, inZone( 'Asia/Kolkata' ) )
		).toEqual( { '2016-04-30': 1 } );
	} );

	it( 'accepts an offset zone as well as a named one', () => {
		expect(
			sanitizeStatsStreakResponse( { data: { 1461955500: 1 } }, inZone( '+05:30' ) )
		).toEqual( { '2016-04-30': 1 } );
	} );

	it( 'follows the zone across a DST change', () => {
		// New York is a day behind UTC on both, under EDT for the first and EST for
		// the second: a pinned -4 offset would put the second on 2016-01-01.
		expect(
			sanitizeStatsStreakResponse( { data: { 1467343800: 1 } }, inZone( 'America/New_York' ) )
		).toEqual( { '2016-06-30': 1 } );
		expect(
			sanitizeStatsStreakResponse( { data: { 1451622600: 1 } }, inZone( 'America/New_York' ) )
		).toEqual( { '2015-12-31': 1 } );
	} );

	it( 'skips keys that are not timestamps', () => {
		expect(
			sanitizeStatsStreakResponse( { data: { total: 5, 1461889800: 1 } }, inZone( 'UTC' ) )
		).toEqual( { '2016-04-29': 1 } );
	} );

	it( 'returns an empty response for malformed data', () => {
		expect( sanitizeStatsStreakResponse( { data: [ 1461889800 ] }, inZone( 'UTC' ) ) ).toEqual(
			{}
		);
	} );
} );

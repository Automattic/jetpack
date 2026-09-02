/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { sanitizeStatsStreakResponse } from '..';
import { streakFixture } from '../__fixtures__/streak';

/** The package defaults before tests override them. */
const DEFAULTS = getSettings();

const withTimezone = ( timezone: { offset: number; string: string } ) =>
	setSettings( {
		...DEFAULTS,
		timezone: { ...timezone, offsetFormatted: String( timezone.offset ), abbr: '' },
	} );

describe( 'Stats streak normalizer', () => {
	afterEach( () => setSettings( DEFAULTS ) );

	it( 'normalizes timestamp counts into date buckets', () => {
		withTimezone( { offset: 0, string: 'UTC' } );

		expect( sanitizeStatsStreakResponse( streakFixture ) ).toEqual( {
			'2016-04-29': 2,
			'2016-04-30': 1,
		} );
	} );

	it( 'buckets by the site calendar day, not the UTC one', () => {
		// The fixture's later timestamps are 23:30 UTC, so an India site has already
		// turned the page on both of them.
		withTimezone( { offset: 5.5, string: 'Asia/Kolkata' } );

		expect( sanitizeStatsStreakResponse( streakFixture ) ).toEqual( {
			'2016-04-29': 1,
			'2016-04-30': 1,
			'2016-05-01': 1,
		} );

		withTimezone( { offset: -4, string: 'America/New_York' } );

		expect( sanitizeStatsStreakResponse( streakFixture ) ).toEqual( {
			'2016-04-28': 1,
			'2016-04-29': 1,
			'2016-04-30': 1,
		} );
	} );

	it( 'buckets a half-hour zone by its own midnight', () => {
		// 2016-04-29 18:45 UTC is 00:15 the next day in India.
		withTimezone( { offset: 5.5, string: 'Asia/Kolkata' } );

		expect( sanitizeStatsStreakResponse( { data: { 1461955500: 1 } } ) ).toEqual( {
			'2016-04-30': 1,
		} );
	} );

	it( 'falls back to the site offset when there is no named timezone', () => {
		withTimezone( { offset: 5.5, string: '' } );

		expect( sanitizeStatsStreakResponse( { data: { 1461955500: 1 } } ) ).toEqual( {
			'2016-04-30': 1,
		} );
	} );

	it( 'follows the zone across a DST change', () => {
		// Both timestamps are 04:30 UTC. New York is a day apart on them only because
		// one is EDT and the other EST, which a fixed offset cannot express.
		withTimezone( { offset: -4, string: 'America/New_York' } );

		expect( sanitizeStatsStreakResponse( { data: { 1467347400: 1 } } ) ).toEqual( {
			'2016-07-01': 1,
		} );
		expect( sanitizeStatsStreakResponse( { data: { 1451622600: 1 } } ) ).toEqual( {
			'2015-12-31': 1,
		} );
	} );

	it( 'returns an empty response for malformed data', () => {
		expect( sanitizeStatsStreakResponse( { data: [ 1461889800 ] } ) ).toEqual( {} );
	} );
} );

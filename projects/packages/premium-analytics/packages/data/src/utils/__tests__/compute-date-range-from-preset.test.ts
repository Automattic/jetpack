/**
 * External dependencies
 */
import { tz } from '@date-fns/tz';
import { getSettings, setSettings } from '@wordpress/date';
import {
	startOfDay,
	endOfDay,
	startOfHour,
	endOfHour,
	subDays,
	subHours,
	subMonths,
	subYears,
	startOfMonth,
	endOfMonth,
	startOfYear,
	endOfYear,
} from 'date-fns';
/**
 * Internal dependencies
 */
import { computeDateRangeFromPreset } from '../preset-date-range';

// `computePrimaryRange` resolves its day bounds in the site zone, so pin it
// rather than letting the machine timezone decide.
setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

// Pin "now" to 2026-02-19 12:00:00 UTC for deterministic, timezone-independent results.
const NOW = new Date( '2026-02-19T12:00:00.000Z' );
const UTC = tz( '+00:00' );

// The site zone is pinned to UTC above, so the encoder writes the `+00:00`
// spelling of the same instant rather than the `Z` `toISOString` produces.
function toSiteISO( date: Date ): string {
	return new Date( date.getTime() ).toISOString().replace( 'Z', '+00:00' );
}

const TODAY_START = startOfDay( NOW, { in: UTC } );
const TODAY_END = endOfDay( NOW, { in: UTC } );
const YESTERDAY_END = endOfDay( subDays( TODAY_START, 1 ), { in: UTC } );
const LAST_MONTH = subMonths( TODAY_START, 1 );

beforeAll( () => {
	jest.useFakeTimers();
	jest.setSystemTime( NOW );
} );

afterAll( () => {
	jest.useRealTimers();
} );

describe( 'computeDateRangeFromPreset', () => {
	it( 'returns today range for "today"', () => {
		const range = computeDateRangeFromPreset( 'today' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( TODAY_START ) );
		expect( range!.to ).toBe( toSiteISO( TODAY_END ) );
	} );

	it( 'returns yesterday range for "yesterday"', () => {
		const range = computeDateRangeFromPreset( 'yesterday' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( subDays( TODAY_START, 1 ) ) );
		expect( range!.to ).toBe( toSiteISO( YESTERDAY_END ) );
	} );

	it( 'returns rolling 24-hour range snapped to the hour for "last-24-hours"', () => {
		const range = computeDateRangeFromPreset( 'last-24-hours' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( subHours( startOfHour( NOW, { in: UTC } ), 23 ) ) );
		expect( range!.to ).toBe( toSiteISO( endOfHour( NOW, { in: UTC } ) ) );
	} );

	it( 'returns 7-day range ending today for "last-7-days"', () => {
		const range = computeDateRangeFromPreset( 'last-7-days' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( subDays( TODAY_START, 6 ) ) );
		expect( range!.to ).toBe( toSiteISO( TODAY_END ) );
	} );

	it( 'returns 30-day range ending today for "last-30-days"', () => {
		const range = computeDateRangeFromPreset( 'last-30-days' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( subDays( TODAY_START, 29 ) ) );
		expect( range!.to ).toBe( toSiteISO( TODAY_END ) );
	} );

	it( 'returns 90-day range ending today for "last-90-days"', () => {
		const range = computeDateRangeFromPreset( 'last-90-days' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( subDays( TODAY_START, 89 ) ) );
		expect( range!.to ).toBe( toSiteISO( TODAY_END ) );
	} );

	it( 'returns 365-day range ending today for "last-365-days"', () => {
		const range = computeDateRangeFromPreset( 'last-365-days' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( subDays( TODAY_START, 364 ) ) );
		expect( range!.to ).toBe( toSiteISO( TODAY_END ) );
	} );

	it( 'returns last calendar month for "last-month"', () => {
		const range = computeDateRangeFromPreset( 'last-month' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( startOfMonth( LAST_MONTH, { in: UTC } ) ) );
		expect( range!.to ).toBe( toSiteISO( endOfMonth( LAST_MONTH, { in: UTC } ) ) );
	} );

	it( 'returns twelve whole calendar months ending today for "last-12-months"', () => {
		const range = computeDateRangeFromPreset( 'last-12-months' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe(
			toSiteISO( startOfMonth( subMonths( TODAY_START, 11 ), { in: UTC } ) )
		);
		expect( range!.to ).toBe( toSiteISO( TODAY_END ) );
	} );

	it( 'returns last calendar year for "last-year"', () => {
		const range = computeDateRangeFromPreset( 'last-year' );
		const lastYear = subYears( TODAY_START, 1 );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( startOfYear( lastYear, { in: UTC } ) ) );
		expect( range!.to ).toBe( toSiteISO( endOfYear( lastYear, { in: UTC } ) ) );
	} );

	it( 'returns the current calendar year through the end of today', () => {
		const range = computeDateRangeFromPreset( 'year-2026' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe( toSiteISO( startOfYear( TODAY_START, { in: UTC } ) ) );
		expect( range!.to ).toBe( toSiteISO( TODAY_END ) );
	} );

	it( 'returns the default year surface through the end of today for all time', () => {
		const range = computeDateRangeFromPreset( 'all-time' );

		expect( range ).toBeDefined();
		expect( range!.from ).toBe(
			toSiteISO( startOfYear( subYears( TODAY_START, 5 ), { in: UTC } ) )
		);
		expect( range!.to ).toBe( toSiteISO( TODAY_END ) );
	} );

	it( 'returns undefined for unrecognized preset', () => {
		// @ts-expect-error – testing with invalid preset on purpose
		const range = computeDateRangeFromPreset( 'not-a-preset' );

		expect( range ).toBeUndefined();
	} );
} );

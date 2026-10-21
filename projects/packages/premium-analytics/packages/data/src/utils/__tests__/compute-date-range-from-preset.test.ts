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
import type { ComputablePresetId } from '@jetpack-premium-analytics/datetime';

// Pin "now" to 2026-02-19 12:00:00 UTC for deterministic, timezone-independent results.
const NOW = new Date( '2026-02-19T12:00:00.000Z' );
const UTC = tz( '+00:00' );

// The site zone is pinned to UTC below, so the encoder writes the `+00:00`
// spelling of the same instant rather than the `Z` `toISOString` produces.
function toSiteISO( date: Date ): string {
	return new Date( date.getTime() ).toISOString().replace( 'Z', '+00:00' );
}

const TODAY_START = startOfDay( NOW, { in: UTC } );
const TODAY_END = endOfDay( NOW, { in: UTC } );
const YESTERDAY_END = endOfDay( subDays( TODAY_START, 1 ), { in: UTC } );
const LAST_MONTH = subMonths( TODAY_START, 1 );
const LAST_YEAR = subYears( TODAY_START, 1 );

describe( 'computeDateRangeFromPreset', () => {
	const originalSettings = getSettings();

	// `computePrimaryRange` resolves its day bounds in the site zone, so pin it
	// rather than letting the machine timezone decide.
	beforeAll( () => {
		setSettings( {
			...originalSettings,
			timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
		} );
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterAll( () => {
		jest.useRealTimers();
		setSettings( originalSettings );
	} );

	it.each< [ ComputablePresetId, Date, Date ] >( [
		[ 'today', TODAY_START, TODAY_END ],
		[ 'yesterday', subDays( TODAY_START, 1 ), YESTERDAY_END ],
		[
			'last-24-hours',
			subHours( startOfHour( NOW, { in: UTC } ), 23 ),
			endOfHour( NOW, { in: UTC } ),
		],
		[ 'last-7-days', subDays( TODAY_START, 6 ), TODAY_END ],
		[ 'last-30-days', subDays( TODAY_START, 29 ), TODAY_END ],
		[ 'last-90-days', subDays( TODAY_START, 89 ), TODAY_END ],
		[ 'last-365-days', subDays( TODAY_START, 364 ), TODAY_END ],
		[ 'month-to-date', startOfMonth( TODAY_START, { in: UTC } ), TODAY_END ],
		[
			'last-month',
			startOfMonth( LAST_MONTH, { in: UTC } ),
			endOfMonth( LAST_MONTH, { in: UTC } ),
		],
		[ 'year-to-date', startOfYear( TODAY_START, { in: UTC } ), TODAY_END ],
		[ 'last-12-months', startOfMonth( subMonths( TODAY_START, 11 ), { in: UTC } ), TODAY_END ],
		[ 'last-year', startOfYear( LAST_YEAR, { in: UTC } ), endOfYear( LAST_YEAR, { in: UTC } ) ],
	] )( 'resolves "%s" to its site-local range', ( preset, from, to ) => {
		expect( computeDateRangeFromPreset( preset ) ).toEqual( {
			from: toSiteISO( from ),
			to: toSiteISO( to ),
		} );
	} );

	it( 'returns undefined for unrecognized preset', () => {
		// @ts-expect-error – testing with invalid preset on purpose
		const range = computeDateRangeFromPreset( 'not-a-preset' );

		expect( range ).toBeUndefined();
	} );
} );

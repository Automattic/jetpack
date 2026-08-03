/**
 * Internal dependencies
 */
import {
	computePrimaryRange,
	DEFAULT_YEAR_SURFACE_COUNT,
	getPresetLabel,
	getYearSurfacePresets,
} from '../presets';
import {
	getPresetYear,
	isPrimaryPreset,
	isSelectablePreset,
	isYearPresetId,
	isYearSurfacePresetId,
	toYearPresetId,
} from '../presets/types';
import { dateToISOStringWithTZ } from '../tz';

// A zone behind UTC, so a naive (UTC) year boundary would land on the wrong day.
const TIME_ZONE = 'America/New_York';

/*
 * Pinned clock. The module derives the current year in `TIME_ZONE` while the
 * test runner reads it in its own zone, and around New Year the two disagree
 * for as long as the offset between them. Midday mid-year is far from both the
 * year boundary and any DST transition, so the two readings can't diverge.
 */
const NOW = new Date( '2026-06-15T12:00:00.000Z' );
const CURRENT_YEAR = NOW.getUTCFullYear();

beforeAll( () => {
	jest.useFakeTimers().setSystemTime( NOW );
} );

afterAll( () => {
	jest.useRealTimers();
} );

describe( 'year preset IDs', () => {
	it( 'round-trips a year through its preset ID', () => {
		expect( toYearPresetId( 2024 ) ).toBe( 'year-2024' );
		expect( getPresetYear( 'year-2024' ) ).toBe( 2024 );
	} );

	it( 'rejects anything that is not a four-digit year ID', () => {
		[ 'year-', 'year-24', 'year-20245', 'last-7-days', 'custom', 42, null ].forEach( value => {
			expect( isYearPresetId( value ) ).toBe( false );
			expect( getPresetYear( value ) ).toBeNull();
		} );
	} );

	it( 'keeps the year surface out of the fixed rolling presets', () => {
		expect( isSelectablePreset( 'year-2024' ) ).toBe( false );
		expect( isSelectablePreset( 'all-time' ) ).toBe( false );

		expect( isYearSurfacePresetId( 'year-2024' ) ).toBe( true );
		expect( isYearSurfacePresetId( 'all-time' ) ).toBe( true );
		expect( isYearSurfacePresetId( 'last-7-days' ) ).toBe( false );
	} );

	it( 'accepts the year surface as a primary preset, so the URL can carry it', () => {
		expect( isPrimaryPreset( 'year-2024' ) ).toBe( true );
		expect( isPrimaryPreset( 'all-time' ) ).toBe( true );
		expect( isPrimaryPreset( 'year-24' ) ).toBe( false );
	} );
} );

describe( 'getPresetLabel', () => {
	it( 'labels years with the bare number and all time with a translated string', () => {
		expect( getPresetLabel( 'year-2024' ) ).toBe( '2024' );
		expect( getPresetLabel( 'all-time' ) ).toBe( 'All time' );
	} );

	it( 'still labels the rolling presets', () => {
		expect( getPresetLabel( 'last-7-days' ) ).toBe( 'Last 7 days' );
		expect( getPresetLabel( 'custom' ) ).toBeNull();
	} );
} );

describe( 'getYearSurfacePresets', () => {
	it( 'lists all time plus the default span of years, newest first', () => {
		const presets = getYearSurfacePresets( TIME_ZONE );

		expect( presets ).toHaveLength( DEFAULT_YEAR_SURFACE_COUNT + 1 );
		expect( presets.map( preset => preset.id ) ).toEqual( [
			'all-time',
			...Array.from( { length: DEFAULT_YEAR_SURFACE_COUNT }, ( _, index ) =>
				toYearPresetId( CURRENT_YEAR - index )
			),
		] );
	} );

	it( 'lists every year from the given start year through the current one', () => {
		const presets = getYearSurfacePresets( TIME_ZONE, { startYear: CURRENT_YEAR - 2 } );

		expect( presets.map( preset => preset.label ) ).toEqual( [
			'All time',
			String( CURRENT_YEAR ),
			String( CURRENT_YEAR - 1 ),
			String( CURRENT_YEAR - 2 ),
		] );
	} );

	it( 'clamps a start year that has not begun yet to the current year', () => {
		const presets = getYearSurfacePresets( TIME_ZONE, { startYear: CURRENT_YEAR + 5 } );

		expect( presets.map( preset => preset.id ) ).toEqual( [
			'all-time',
			toYearPresetId( CURRENT_YEAR ),
		] );
	} );

	it( 'starts the all-time range at the oldest year it lists', () => {
		const [ allTime ] = getYearSurfacePresets( TIME_ZONE, { startYear: 2019 } );

		expect( dateToISOStringWithTZ( allTime.range.from, TIME_ZONE ) ).toBe(
			'2019-01-01T00:00:00.000-05:00'
		);
		expect( allTime.range.to.getTime() ).toBeGreaterThan( Date.now() );
	} );
} );

/**
 * Compute a range that must exist, so a preset the module stops recognizing
 * fails loudly instead of asserting on an optional and reading as a pass.
 *
 * @param args - The `computePrimaryRange` arguments.
 * @return The computed range.
 */
function rangeOf( ...args: Parameters< typeof computePrimaryRange > ) {
	const range = computePrimaryRange( ...args );

	if ( ! range ) {
		throw new Error( `No range computed for "${ args[ 0 ] }"` );
	}

	return range;
}

describe( 'computePrimaryRange for the year surface', () => {
	it( 'spans a past year end to end, on the timezone boundaries', () => {
		const range = rangeOf( 'year-2019', TIME_ZONE );

		expect( dateToISOStringWithTZ( range.from, TIME_ZONE ) ).toBe(
			'2019-01-01T00:00:00.000-05:00'
		);
		expect( dateToISOStringWithTZ( range.to, TIME_ZONE ) ).toBe( '2019-12-31T23:59:59.999-05:00' );
	} );

	it( 'stops the current year at the end of today instead of a future December', () => {
		const currentYear = rangeOf( toYearPresetId( CURRENT_YEAR ), TIME_ZONE );

		expect( currentYear.from.getFullYear() ).toBe( CURRENT_YEAR );
		expect( currentYear.to.getTime() ).toBe( rangeOf( 'all-time', TIME_ZONE ).to.getTime() );
	} );

	it( 'honors the start year for all time, and defaults it otherwise', () => {
		expect(
			dateToISOStringWithTZ( rangeOf( 'all-time', TIME_ZONE, { startYear: 2015 } ).from, TIME_ZONE )
		).toBe( '2015-01-01T00:00:00.000-05:00' );

		expect( rangeOf( 'all-time', TIME_ZONE ).from.getFullYear() ).toBe(
			CURRENT_YEAR - ( DEFAULT_YEAR_SURFACE_COUNT - 1 )
		);
	} );

	it( 'still computes the rolling presets', () => {
		const range = rangeOf( 'last-24-hours', TIME_ZONE );

		expect( range.to.getTime() - range.from.getTime() ).toBe( 24 * 60 * 60 * 1000 );
	} );
} );

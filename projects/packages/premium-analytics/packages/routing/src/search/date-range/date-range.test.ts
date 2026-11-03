/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import {
	decodeDateSearchParam,
	encodeDateToSearchParam,
	encodeRangeToSearchParams,
} from './date-range';

const DEFAULTS = getSettings();

describe( 'decodeDateSearchParam', () => {
	beforeEach( () => {
		setSettings( {
			...DEFAULTS,
			timezone: {
				offset: -4,
				offsetFormatted: '-4',
				string: 'America/New_York',
				abbr: 'EDT',
			},
		} );
	} );

	it( 'returns undefined for a missing value', () => {
		expect( decodeDateSearchParam() ).toBeUndefined();
	} );

	it( 'returns undefined for a malformed value', () => {
		expect( decodeDateSearchParam( '2026-06-29T12:60:00' ) ).toBeUndefined();
	} );

	it( 'anchors an offset-less value to the requested timezone', () => {
		const date = decodeDateSearchParam( '2026-06-29', 'Pacific/Honolulu' );

		expect( date?.toISOString() ).toBe( '2026-06-29T10:00:00.000Z' );
	} );
} );

describe( 'encodeDateToSearchParam', () => {
	beforeEach( () => {
		setSettings( {
			...DEFAULTS,
			timezone: {
				offset: -4,
				offsetFormatted: '-4',
				string: 'America/New_York',
				abbr: 'EDT',
			},
		} );
	} );

	it( 'returns undefined for a missing date', () => {
		expect( encodeDateToSearchParam() ).toBeUndefined();
	} );

	it( 'writes the offset of the site zone, not a bare Z', () => {
		expect( encodeDateToSearchParam( new Date( '2026-06-29T04:00:00.000Z' ) ) ).toBe(
			'2026-06-29T00:00:00.000-04:00'
		);
	} );

	it( 'follows the site zone when it changes', () => {
		setSettings( {
			...DEFAULTS,
			timezone: { offset: 9, offsetFormatted: '9', string: 'Asia/Tokyo', abbr: 'JST' },
		} );

		expect( encodeDateToSearchParam( new Date( '2026-06-29T04:00:00.000Z' ) ) ).toBe(
			'2026-06-29T13:00:00.000+09:00'
		);
	} );

	it( 'round-trips a decoded value', () => {
		const encoded = encodeDateToSearchParam( new Date( '2026-06-29T04:00:00.000Z' ) );

		expect( decodeDateSearchParam( encoded )?.toISOString() ).toBe( '2026-06-29T04:00:00.000Z' );
	} );
} );

describe( 'encodeRangeToSearchParams', () => {
	beforeEach( () => {
		setSettings( {
			...DEFAULTS,
			timezone: {
				offset: -4,
				offsetFormatted: '-4',
				string: 'America/New_York',
				abbr: 'EDT',
			},
		} );
	} );

	// Midnight in the site zone, the shape the calendar inputs stage.
	const from = new TZDate( '2026-06-29T04:00:00.000Z', 'America/New_York' );
	const to = new TZDate( '2026-07-09T04:00:00.000Z', 'America/New_York' );

	it( 'extends a calendar edit to the end of the site day', () => {
		expect( encodeRangeToSearchParams( { from, to } ) ).toEqual( {
			from: '2026-06-29T00:00:00.000-04:00',
			to: '2026-07-09T23:59:59.999-04:00',
		} );
	} );

	it( 'stores a selectable preset range as given', () => {
		expect( encodeRangeToSearchParams( { from, to }, { presetId: 'last-24-hours' } ).to ).toBe(
			'2026-07-09T00:00:00.000-04:00'
		);
	} );

	it( 'stores an exact range as given', () => {
		expect( encodeRangeToSearchParams( { from, to }, { exactRange: true } ).to ).toBe(
			'2026-07-09T00:00:00.000-04:00'
		);
	} );

	// The year surface computes its own bounds too, so they are stored as given.
	it( 'stores a year-surface range as given', () => {
		expect( encodeRangeToSearchParams( { from, to }, { presetId: 'year-2025' } ).to ).toBe(
			'2026-07-09T00:00:00.000-04:00'
		);
		expect( encodeRangeToSearchParams( { from, to }, { presetId: 'all-time' } ).to ).toBe(
			'2026-07-09T00:00:00.000-04:00'
		);
	} );

	// 'custom' marks a manual edit, so it takes the calendar rule, not the preset one.
	it( 'extends a custom range', () => {
		expect( encodeRangeToSearchParams( { from, to }, { presetId: 'custom' } ).to ).toBe(
			'2026-07-09T23:59:59.999-04:00'
		);
	} );
} );

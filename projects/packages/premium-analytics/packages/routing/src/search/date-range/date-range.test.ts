/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { decodeDateSearchParam, encodeDateToSearchParam } from './date-range';

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

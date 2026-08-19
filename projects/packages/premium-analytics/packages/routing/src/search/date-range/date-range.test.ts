/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { decodeDateSearchParam } from './date-range';

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

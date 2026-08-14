jest.mock( '../../utils/ensure-core-settings', () => ( {
	ensureCoreSettingsReady: jest.fn( () => Promise.resolve() ),
} ) );
/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { getDefaultPreset, getDefaultQueryParams } from '../reports';

// `localTZDate()` defaults to the site zone, so pin it rather than letting the
// machine timezone decide which calendar day the presets resolve to.
setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

describe( 'getDefaultQueryParams - preset override', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.setSystemTime( new Date( '2025-03-15T12:00:00.000Z' ) );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'defaults to last-30-days when no preset is given', () => {
		expect( getDefaultQueryParams().preset ).toBe( 'last-30-days' );
	} );

	it( 'uses today preset when passed', () => {
		expect( getDefaultQueryParams( false, 'today' ).preset ).toBe( 'today' );
	} );

	it( 'uses last-7-days preset when passed', () => {
		expect( getDefaultQueryParams( false, 'last-7-days' ).preset ).toBe( 'last-7-days' );
	} );

	it( 'uses last-30-days preset when passed', () => {
		expect( getDefaultQueryParams( false, 'last-30-days' ).preset ).toBe( 'last-30-days' );
	} );
} );

describe( 'getDefaultPreset', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.setSystemTime( new Date( '2025-03-15T12:00:00.000Z' ) );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'returns last-30-days when no launched date', () => {
		expect( getDefaultPreset() ).toBe( 'last-30-days' );
	} );

	it( 'returns last-30-days for undefined', () => {
		expect( getDefaultPreset( undefined ) ).toBe( 'last-30-days' );
	} );

	it( 'returns today when store launched today', () => {
		expect( getDefaultPreset( '2025-03-15T00:00:00Z' ) ).toBe( 'today' );
	} );

	it( 'returns last-7-days when launched 3 days ago', () => {
		expect( getDefaultPreset( '2025-03-12T00:00:00Z' ) ).toBe( 'last-7-days' );
	} );

	it( 'returns last-7-days when launched exactly 7 days ago', () => {
		expect( getDefaultPreset( '2025-03-08T00:00:00Z' ) ).toBe( 'last-7-days' );
	} );

	it( 'returns last-30-days when launched 8 days ago', () => {
		expect( getDefaultPreset( '2025-03-07T00:00:00Z' ) ).toBe( 'last-30-days' );
	} );

	it( 'returns last-30-days when launched months ago', () => {
		expect( getDefaultPreset( '2024-01-01T00:00:00Z' ) ).toBe( 'last-30-days' );
	} );

	it( 'returns today when launched in the future', () => {
		expect( getDefaultPreset( '2025-04-01T00:00:00Z' ) ).toBe( 'today' );
	} );
} );

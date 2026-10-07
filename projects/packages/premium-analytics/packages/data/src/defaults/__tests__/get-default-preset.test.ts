/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { getSettings, setSettings } from '@wordpress/date';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DASHBOARD_PREFERENCES_SCOPE } from '../remembered-preset';
import { getDefaultPreset, getDefaultQueryParams } from '../reports';

type PreferencesActions = { set: ( scope: string, name: string, value: unknown ) => void };

const V1_KEY = 'jetpack_stats_stored_date_range_shortcut_id_123';

describe( 'default report params', () => {
	const originalSettings = getSettings();

	// `localTZDate()` defaults to the site zone, so pin it rather than letting the
	// machine timezone decide which calendar day the presets resolve to.
	beforeAll( () => {
		setSettings( {
			...originalSettings,
			timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
		} );
	} );

	afterAll( () => {
		setSettings( originalSettings );
	} );

	describe( 'getDefaultQueryParams - preset override', () => {
		beforeEach( () => {
			jest.useFakeTimers();
			jest.setSystemTime( new Date( '2025-03-15T12:00:00.000Z' ) );
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'uses last-7-days preset when passed', () => {
			expect( getDefaultQueryParams( false, 'last-7-days' ) ).toEqual( {
				from: '2025-03-09T00:00:00.000+00:00',
				to: '2025-03-15T23:59:59.999+00:00',
				preset: 'last-7-days',
				interval: 'day',
			} );
		} );
	} );

	describe( 'getDefaultPreset', () => {
		const setRemembered = ( value: unknown ) =>
			( dispatch( preferencesStore ) as unknown as PreferencesActions ).set(
				DASHBOARD_PREFERENCES_SCOPE,
				'datePreset',
				value
			);

		beforeEach( () => {
			Object.defineProperty( window, 'JetpackScriptData', {
				configurable: true,
				value: { site: { wpcom: { blog_id: 123 } } },
			} );
		} );

		afterEach( () => {
			delete window.JetpackScriptData;
			setRemembered( undefined );
			window.localStorage.clear();
		} );

		it( 'opens on the last 7 days with nothing to inherit', () => {
			expect( getDefaultPreset() ).toBe( 'last-7-days' );
		} );

		it.each( [
			[ 'last_30_days', 'last-30-days' ],
			[ 'year_to_date', 'year-to-date' ],
			[ 'last_3_years', 'last-12-months' ],
			[ 'constructor', 'last-7-days' ],
		] )( 'maps the v1 shortcut %s to %s', ( shortcutId, preset ) => {
			window.localStorage.setItem( V1_KEY, shortcutId );

			expect( getDefaultPreset() ).toBe( preset );
		} );

		it( 'opens on the last 7 days when the browser blocks storage', () => {
			const getItem = jest.spyOn( Storage.prototype, 'getItem' ).mockImplementation( () => {
				throw new DOMException( 'denied', 'SecurityError' );
			} );

			try {
				expect( getDefaultPreset() ).toBe( 'last-7-days' );
			} finally {
				getItem.mockRestore();
			}
		} );

		it( 'falls back to the v1 key from before it was per site', () => {
			window.localStorage.setItem( 'jetpack_stats_stored_date_range_shortcut_id', 'today' );

			expect( getDefaultPreset() ).toBe( 'today' );
		} );

		it( 'prefers the preset applied in v2 over the v1 one', () => {
			window.localStorage.setItem( V1_KEY, 'last_30_days' );
			setRemembered( 'month-to-date' );

			expect( getDefaultPreset() ).toBe( 'month-to-date' );
		} );

		it( 'ignores a stored value that is not a preset', () => {
			setRemembered( 'year-2024' );

			expect( getDefaultPreset() ).toBe( 'last-7-days' );
		} );
	} );

	describe( 'getDefaultQueryParams - comparison', () => {
		beforeEach( () => {
			jest.useFakeTimers();
			jest.setSystemTime( new Date( '2026-08-20T12:00:00.000Z' ) );
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'compares the 12-month preset with the same window twelve months back', () => {
			// Twelve months back from the first, ending on the same day of the
			// month the reference has reached, so the two cover the same 354 days.
			expect( getDefaultQueryParams( true, 'last-12-months' ) ).toMatchObject( {
				from: '2025-09-01T00:00:00.000+00:00',
				to: '2026-08-20T23:59:59.999+00:00',
				compare_from: '2024-09-01T00:00:00.000+00:00',
				compare_to: '2025-08-20T23:59:59.999+00:00',
				compare_preset: 'previous-period',
			} );
		} );
	} );
} );

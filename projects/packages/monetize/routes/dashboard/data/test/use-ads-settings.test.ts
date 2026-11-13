import jetpackAnalytics from '@automattic/jetpack-analytics';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useAdsSettings } from '../use-ads-settings';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => ( {
		user: { current_user: { wpcom: { ID: 7, login: 'owner' } } },
		monetize: { adsSettings: { tracks: true } },
	} ),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;
const recordEvent = jetpackAnalytics.tracks.recordEvent as jest.Mock;

const STORED = {
	wordads: '1',
	wordads_display_page: '0',
	enable_header_ad: 0,
	wordads_custom_adstxt: null,
};

/**
 * Render the hook once the stored settings have loaded.
 *
 * @return The hook's result.
 */
async function renderLoaded() {
	mockedApiFetch.mockResolvedValueOnce( STORED );
	const view = renderHook( () => useAdsSettings() );
	await waitFor( () => expect( view.result.current.values ).toBeDefined() );
	return view;
}

describe( 'useAdsSettings', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
		recordEvent.mockClear();
	} );

	it( 'reads stored "0" and 0 as off', async () => {
		const { result } = await renderLoaded();

		expect( result.current.values ).toMatchObject( {
			wordads: true,
			wordads_display_page: false,
			enable_header_ad: false,
			wordads_custom_adstxt: '',
		} );
	} );

	it( 'saves an option and records the toggle', async () => {
		const { result } = await renderLoaded();
		mockedApiFetch.mockResolvedValueOnce( {} );

		await act( () => result.current.setOption( 'wordads_display_page', true ) );

		expect( mockedApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { wordads_display_page: true },
		} );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_settings_toggle', {
			module: 'wordads',
			setting: 'wordads_display_page',
			toggled: 'on',
			origin: 'monetize-settings-tab',
		} );
		expect( result.current.values?.wordads_display_page ).toBe( true );
	} );

	it( 'switches ads through the module endpoint', async () => {
		const { result } = await renderLoaded();
		mockedApiFetch.mockResolvedValueOnce( {} );

		await act( () => result.current.setModuleActive( false ) );

		expect( mockedApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/module/wordads/active',
			method: 'POST',
			data: { active: false },
		} );
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_wpa_module_toggle', {
			module: 'wordads',
			toggled: 'off',
			origin: 'monetize-settings-tab',
		} );
		expect( result.current.values?.wordads ).toBe( false );
	} );

	it( 'goes back to the stored value when a save fails', async () => {
		const { result } = await renderLoaded();
		mockedApiFetch.mockRejectedValueOnce( new Error( 'rest_forbidden' ) );

		await act( () => result.current.setOption( 'wordads_display_page', true ) );

		expect( result.current.values?.wordads_display_page ).toBe( false );
		expect( result.current.saveError ).toBe( true );
	} );

	it( 'saves an emptied text option without a toggle event', async () => {
		const { result } = await renderLoaded();
		mockedApiFetch.mockResolvedValueOnce( {} );

		await act( () => result.current.setOption( 'wordads_custom_adstxt', '' ) );

		expect( mockedApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { wordads_custom_adstxt: '' },
		} );
		expect( recordEvent ).not.toHaveBeenCalled();
	} );
} );

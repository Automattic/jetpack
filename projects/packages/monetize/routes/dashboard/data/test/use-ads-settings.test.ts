import jetpackAnalytics from '@automattic/jetpack-analytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement } from 'react';
import { ADS_ACCOUNT_KEY, ADS_SETTINGS_KEY } from '../ads-keys';
import { useAdsSettings } from '../use-ads-settings';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );
let mockSimple = false;

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockSimple,
	getScriptData: () => ( {
		user: { current_user: { wpcom: { ID: 7, login: 'owner' } } },
		monetize: { tracks: true },
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

const SIMPLE_SETTINGS = {
	show_to_logged_in: 'no',
	display_options: { display_page: false, sidebar: false },
	ccpa_enabled: true,
};

/**
 * Render the hook on Simple once WordPress.com's settings and Ads account have loaded.
 *
 * @return The hook's result.
 */
async function renderSimpleLoaded() {
	mockSimple = true;
	mockedApiFetch.mockImplementation( ( { path, method }: { path: string; method?: string } ) => {
		if ( method === 'POST' ) {
			return Promise.resolve( {} );
		}
		return Promise.resolve(
			path.includes( 'wordads/account' )
				? { approved: true, active: true }
				: { settings: SIMPLE_SETTINGS }
		);
	} );
	const queryClient = new QueryClient();
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client: queryClient }, children );
	const view = renderHook( () => useAdsSettings(), { wrapper } );
	await waitFor( () => expect( view.result.current.values ).toBeDefined() );
	return view;
}

/**
 * Render the hook once the stored settings have loaded.
 *
 * @return The hook's result.
 */
async function renderLoaded() {
	mockedApiFetch.mockResolvedValueOnce( STORED );
	const queryClient = new QueryClient();
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client: queryClient }, children );
	const view = renderHook( () => useAdsSettings(), { wrapper } );
	await waitFor( () => expect( view.result.current.values ).toBeDefined() );
	return { ...view, queryClient };
}

describe( 'useAdsSettings', () => {
	beforeEach( () => {
		mockSimple = false;
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
		const { result, queryClient } = await renderLoaded();
		queryClient.setQueryData( ADS_ACCOUNT_KEY, { active: true } );
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
		// The Ads tab reads the switch from these, so it shows the change without refetching.
		expect( queryClient.getQueryData( ADS_SETTINGS_KEY ) ).toMatchObject( { wordads: false } );
		expect( queryClient.getQueryData( ADS_ACCOUNT_KEY ) ).toEqual( { active: false } );
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

	it( 'reads WordPress.com’s settings and switch on Simple', async () => {
		const { result } = await renderSimpleLoaded();

		expect( result.current.values ).toMatchObject( {
			wordads: true,
			logged_out_only: true,
			wordads_display_page: false,
			wordads_display_post: true,
			sidebar: false,
			wordads_ccpa_enabled: true,
			wordads_cmp_enabled: false,
		} );
	} );

	it.each( [
		[ 'a placement', 'wordads_display_page', true, { display_options: { display_page: true } } ],
		[ 'the sidebar', 'sidebar', true, { display_options: { sidebar: true } } ],
		[ 'ads for everyone', 'logged_out_only', false, { show_to_logged_in: 'yes' } ],
		[ 'US privacy', 'wordads_ccpa_enabled', false, { ccpa_enabled: false } ],
		[
			'the privacy policy',
			'wordads_ccpa_privacy_policy_url',
			'https://example.com/privacy',
			{ ccpa_privacy_policy_url: 'https://example.com/privacy' },
		],
		[ 'ads off', 'wordads', false, { show_to_logged_in: 'pause' } ],
		[ 'ads on', 'wordads', true, { show_to_logged_in: 'no', tos: 'signed' } ],
	] as const )( 'saves %s on WordPress.com on Simple', async ( _case, name, value, data ) => {
		const { result } = await renderSimpleLoaded();

		await act( () =>
			name === 'wordads'
				? result.current.setModuleActive( value )
				: result.current.setOption( name, value )
		);

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/wordads/settings',
			method: 'POST',
			data,
		} );
		expect( result.current.saveError ).toBe( false );
	} );
} );

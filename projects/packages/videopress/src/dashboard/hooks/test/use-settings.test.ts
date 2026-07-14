import { renderHook, waitFor, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { setSimpleSite, unsetSimpleSite } from '../../test-utils/simple-site';
import { isPrivateForSiteServerControlled, useSettings, useUpdateSettings } from '../use-settings';

describe( 'isPrivateForSiteServerControlled', () => {
	it( 'is server-controlled on WordPress.com Simple regardless of site privacy', () => {
		expect( isPrivateForSiteServerControlled( { siteType: 'simple', siteIsPrivate: true } ) ).toBe(
			true
		);
		expect( isPrivateForSiteServerControlled( { siteType: 'simple', siteIsPrivate: false } ) ).toBe(
			true
		);
	} );

	it( 'is server-controlled (non-writable) on private Atomic / WoA sites', () => {
		expect( isPrivateForSiteServerControlled( { siteType: 'atomic', siteIsPrivate: true } ) ).toBe(
			true
		);
	} );

	it( 'stays writable on public Atomic and self-hosted Jetpack sites', () => {
		expect( isPrivateForSiteServerControlled( { siteType: 'atomic', siteIsPrivate: false } ) ).toBe(
			false
		);
		expect(
			isPrivateForSiteServerControlled( { siteType: 'jetpack', siteIsPrivate: false } )
		).toBe( false );
	} );

	it( 'defaults to writable while settings are still loading', () => {
		expect( isPrivateForSiteServerControlled( undefined ) ).toBe( false );
	} );
} );

describe( 'useSettings', () => {
	it( 'fetches videopress/v1/settings', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path === '/videopress/v1/settings' ) {
				return {
					videopress_videos_private_for_site: true,
					videopress_auto_subtitles_disabled: true,
					site_is_private: false,
					site_type: 'jetpack',
				};
			}
			throw new Error( `unexpected path: ${ path }` );
		} );

		const { result } = renderHook( () => useSettings(), { wrapper: createTestWrapper() } );
		await waitFor( () => expect( result.current.data ).toBeDefined() );
		expect( result.current.data?.videoPressVideosPrivateForSite ).toBe( true );
		expect( result.current.data?.videoPressAutoSubtitlesDisabled ).toBe( true );
		expect( result.current.data?.siteIsPrivate ).toBe( false );
	} );
} );

describe( 'useUpdateSettings', () => {
	it( 'POSTs videopress_videos_private_for_site and optimistically updates the cache', async () => {
		const calls: { path?: string; method?: string; data?: unknown }[] = [];
		// Track server state so the refetch after onSettled returns the updated value.
		let serverValue = false;
		mockApiFetch( async ( { path, method, data } ) => {
			calls.push( { path, method, data } );
			if ( method === 'POST' ) {
				serverValue = ( data as Record< string, unknown > )
					?.videopress_videos_private_for_site as boolean;
				return { code: 'success', message: 'ok', data: 200 };
			}
			return {
				videopress_videos_private_for_site: serverValue,
				videopress_auto_subtitles_disabled: false,
				site_is_private: false,
				site_type: 'jetpack',
			};
		} );

		const client = createTestQueryClient();
		const wrapper = createTestWrapper( client );
		const { result: settingsResult } = renderHook( () => useSettings(), { wrapper } );
		await waitFor( () => expect( settingsResult.current.data ).toBeDefined() );

		const { result: mutationResult } = renderHook( () => useUpdateSettings(), { wrapper } );
		await act( async () => {
			await mutationResult.current.mutateAsync( { videoPressVideosPrivateForSite: true } );
		} );

		const postCall = calls.find( c => c.method === 'POST' );
		expect( postCall?.data ).toEqual( { videopress_videos_private_for_site: true } );
		await waitFor( () =>
			expect( settingsResult.current.data?.videoPressVideosPrivateForSite ).toBe( true )
		);
	} );

	it( 'POSTs videopress_auto_subtitles_disabled and optimistically updates the cache', async () => {
		const calls: { path?: string; method?: string; data?: unknown }[] = [];
		// Track server state so the refetch after onSettled returns the updated value.
		let serverValue = false;
		mockApiFetch( async ( { path, method, data } ) => {
			calls.push( { path, method, data } );
			if ( method === 'POST' ) {
				serverValue = ( data as Record< string, unknown > )
					?.videopress_auto_subtitles_disabled as boolean;
				return { code: 'success', message: 'ok', data: 200 };
			}
			return {
				videopress_videos_private_for_site: false,
				videopress_auto_subtitles_disabled: serverValue,
				site_is_private: false,
				site_type: 'jetpack',
			};
		} );

		const client = createTestQueryClient();
		const wrapper = createTestWrapper( client );
		const { result: settingsResult } = renderHook( () => useSettings(), { wrapper } );
		await waitFor( () => expect( settingsResult.current.data ).toBeDefined() );

		const { result: mutationResult } = renderHook( () => useUpdateSettings(), { wrapper } );
		await act( async () => {
			await mutationResult.current.mutateAsync( {
				videoPressAutoSubtitlesDisabled: true,
			} );
		} );

		const postCall = calls.find( c => c.method === 'POST' );
		expect( postCall?.data ).toEqual( { videopress_auto_subtitles_disabled: true } );
		await waitFor( () =>
			expect( settingsResult.current.data?.videoPressAutoSubtitlesDisabled ).toBe( true )
		);
	} );

	it( 'sends no request for an empty patch', async () => {
		const calls: { method?: string }[] = [];
		mockApiFetch( async ( { method } ) => {
			calls.push( { method } );
			return {
				videopress_videos_private_for_site: false,
				videopress_auto_subtitles_disabled: false,
				site_is_private: false,
				site_type: 'jetpack',
			};
		} );

		const wrapper = createTestWrapper();
		const { result: mutationResult } = renderHook( () => useUpdateSettings(), { wrapper } );
		await act( async () => {
			await mutationResult.current.mutateAsync( {} );
		} );

		expect( calls.some( c => c.method === 'POST' ) ).toBe( false );
	} );

	it( 'rolls back on error', async () => {
		mockApiFetch( async ( { method } ) => {
			if ( method === 'POST' ) {
				throw new Error( 'fail' );
			}
			return {
				videopress_videos_private_for_site: false,
				videopress_auto_subtitles_disabled: false,
				site_is_private: false,
				site_type: 'jetpack',
			};
		} );

		const client = createTestQueryClient();
		const wrapper = createTestWrapper( client );
		const { result: settingsResult } = renderHook( () => useSettings(), { wrapper } );
		await waitFor( () => expect( settingsResult.current.data ).toBeDefined() );

		const { result: mutationResult } = renderHook( () => useUpdateSettings(), { wrapper } );
		await act( async () => {
			try {
				await mutationResult.current.mutateAsync( { videoPressVideosPrivateForSite: true } );
			} catch {
				// expected — POST throws to simulate a server error
			}
		} );

		await waitFor( () =>
			expect( settingsResult.current.data?.videoPressVideosPrivateForSite ).toBe( false )
		);
	} );
} );

describe( 'on WordPress.com Simple', () => {
	beforeEach( setSimpleSite );
	afterEach( unsetSimpleSite );

	it( 'reads settings from wpcom/v2/videopress/settings', async () => {
		mockApiFetch( async ( { path } ) => {
			if ( path === '/wpcom/v2/videopress/settings' ) {
				return {
					videopress_videos_private_for_site: false,
					videopress_auto_subtitles_disabled: true,
					site_is_private: true,
					site_type: 'simple',
				};
			}
			throw new Error( `unexpected path: ${ path }` );
		} );

		const { result } = renderHook( () => useSettings(), { wrapper: createTestWrapper() } );
		await waitFor( () => expect( result.current.data ).toBeDefined() );
		expect( result.current.data?.videoPressAutoSubtitlesDisabled ).toBe( true );
		expect( result.current.data?.siteIsPrivate ).toBe( true );
		expect( result.current.data?.siteType ).toBe( 'simple' );
	} );

	it( 'writes settings to wpcom/v2/videopress/settings', async () => {
		const calls: { path?: string; method?: string; data?: unknown }[] = [];
		mockApiFetch( async ( { path, method, data } ) => {
			calls.push( { path, method, data } );
			if ( method === 'POST' ) {
				return { code: 'success', message: 'ok', data: 200 };
			}
			return {
				videopress_videos_private_for_site: false,
				videopress_auto_subtitles_disabled: true,
				site_is_private: true,
				site_type: 'simple',
			};
		} );

		const wrapper = createTestWrapper();
		const { result } = renderHook( () => useUpdateSettings(), { wrapper } );
		await act( async () => {
			await result.current.mutateAsync( { videoPressAutoSubtitlesDisabled: true } );
		} );

		const postCall = calls.find( c => c.method === 'POST' );
		expect( postCall?.path ).toBe( '/wpcom/v2/videopress/settings' );
		expect( postCall?.data ).toEqual( { videopress_auto_subtitles_disabled: true } );
	} );
} );

import { queryClient as legacyClient } from '@automattic/jetpack-react-data-sync-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type PropsWithChildren } from 'react';
import { useDismissibleAlertState as useLegacyDismissal } from '../../../app/assets/src/js/features/performance-history/lib/hooks';
import { useDismissibleAlertState as useOverviewDismissal } from './use-performance-history';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

it( 'preserves Overview dismissals when the separate legacy client dismisses a notice', async () => {
	const overviewClient = new QueryClient( {
		defaultOptions: { queries: { retry: false, gcTime: Infinity } },
	} );
	const hadFetch = Object.hasOwn( globalThis, 'fetch' );
	if ( ! hadFetch ) {
		Object.defineProperty( globalThis, 'fetch', {
			configurable: true,
			writable: true,
			value: jest.fn(),
		} );
	}
	let stored: Record< string, boolean > = { performance_history_fresh_start: true };
	const writes: { url: string; value: Record< string, boolean > }[] = [];
	let releaseLegacyWrite: () => void;
	const legacyWrite = new Promise< void >( resolve => {
		releaseLegacyWrite = resolve;
	} );
	const respond = ( url: string, method?: string, value?: Record< string, boolean > ) => {
		if ( method === 'POST' ) {
			writes.push( { url, value } );
			stored = url.endsWith( '/merge' ) ? { ...stored, ...value } : { ...value };
		}
		return { status: 'success', JSON: { ...stored } };
	};
	Object.defineProperty( globalThis, 'Jetpack_Boost', {
		configurable: true,
		value: { site: { online: true } },
	} );
	window.jetpack_boost_ds = {
		rest_api: { nonce: 'rest-nonce', value: 'https://example.org/wp-json/jetpack-boost-ds' },
		dismissed_alerts: { nonce: 'alerts-nonce', value: { ...stored } },
	};
	jest.mocked( apiFetch ).mockImplementation( async ( { url, method, data } ) => {
		const value = ( data as { JSON: Record< string, boolean > } )?.JSON;
		if ( value?.legacy_minify_notice ) {
			await legacyWrite;
		}
		return respond( url, method, value );
	} );
	const fetchSpy = jest.spyOn( globalThis, 'fetch' ).mockImplementation( async ( url, options ) => {
		if ( options.method === 'POST' ) {
			await legacyWrite;
		}
		const response = respond(
			String( url ),
			options.method,
			options.body ? JSON.parse( options.body as string ).JSON : undefined
		);
		return { ok: true, text: async () => JSON.stringify( response ) } as Response;
	} );
	const wrapperFor =
		( client: QueryClient ) =>
		( { children }: PropsWithChildren ) =>
			createElement( QueryClientProvider, { client }, children );
	try {
		const { result: legacy } = renderHook( () => useLegacyDismissal( 'legacy_minify_notice' ), {
			wrapper: wrapperFor( legacyClient ),
		} );
		const { result: overview } = renderHook( () => useOverviewDismissal( 'score_decrease' ), {
			wrapper: wrapperFor( overviewClient ),
		} );
		await waitFor( () => expect( overviewClient.isFetching() ).toBe( 0 ) );
		act( () => overview.current[ 1 ]() );
		await waitFor( () => expect( stored.score_decrease ).toBe( true ) );
		expect( legacyClient.getQueryData( [ 'dismissed_alerts' ] ) ).toEqual( {
			performance_history_fresh_start: true,
		} );
		act( () => legacy.current[ 1 ]() );
		await waitFor( () => expect( legacy.current[ 0 ] ).toBe( true ) );
		expect( legacyClient.getQueryData( [ 'dismissed_alerts' ] ) ).toEqual( {
			performance_history_fresh_start: true,
			legacy_minify_notice: true,
		} );
		await act( async () => releaseLegacyWrite() );
		await waitFor( () => expect( legacyClient.isMutating() ).toBe( 0 ) );
		expect( writes ).toEqual( [
			{ url: expect.stringMatching( /\/merge$/ ), value: { score_decrease: true } },
			{ url: expect.stringMatching( /\/merge$/ ), value: { legacy_minify_notice: true } },
		] );
		expect( stored ).toEqual( {
			performance_history_fresh_start: true,
			score_decrease: true,
			legacy_minify_notice: true,
		} );
	} finally {
		releaseLegacyWrite();
		legacyClient.clear();
		overviewClient.clear();
		fetchSpy.mockRestore();
		if ( ! hadFetch ) {
			Reflect.deleteProperty( globalThis, 'fetch' );
		}
		jest.mocked( apiFetch ).mockReset();
	}
} );

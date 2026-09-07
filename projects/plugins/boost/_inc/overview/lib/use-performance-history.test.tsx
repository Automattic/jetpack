import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type PropsWithChildren } from 'react';
import {
	parsePerformanceHistory,
	useDismissibleAlertState,
	usePerformanceHistory,
} from './use-performance-history';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const fetchMock = jest.mocked( apiFetch );
const history = {
	startDate: 1700000000000,
	endDate: 1700086400000,
	periods: [
		{
			timestamp: 1700000000000,
			dimensions: {
				desktop_overall_score: 90,
				mobile_overall_score: 70,
				desktop_cls: 0.01,
				desktop_lcp: 1000,
				desktop_tbt: 120,
				mobile_cls: 0.1,
				mobile_lcp: 2000,
				mobile_tbt: 300,
			},
		},
	],
	annotations: [ { timestamp: 1700000000000, text: 'Boost activated' } ],
};
let queryClient: QueryClient;
function wrapper( { children }: PropsWithChildren ) {
	return createElement( QueryClientProvider, { client: queryClient }, children );
}

beforeEach( () => {
	fetchMock.mockReset();
	queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false, gcTime: Infinity } },
	} );
	Object.defineProperty( globalThis, 'Jetpack_Boost', {
		configurable: true,
		value: { site: { online: true } },
	} );
	window.jetpack_boost_ds = {
		rest_api: { nonce: 'rest-nonce', value: 'https://example.org/wp-json/jetpack-boost-ds/' },
		performance_history: { nonce: 'history-nonce', value: null },
		dismissed_alerts: { nonce: 'alerts-nonce', value: { score_increase: true } },
	};
} );

afterEach( () => queryClient.clear() );

it( 'preserves eight dimensions, millisecond timestamps, annotations, and null history', () => {
	expect( parsePerformanceHistory( history ) ).toEqual( history );
	expect( parsePerformanceHistory( null ) ).toBeNull();
	expect( () =>
		parsePerformanceHistory( {
			...history,
			periods: [
				{
					...history.periods[ 0 ],
					dimensions: { mobile_overall_score: 90 },
				},
			],
		} )
	).toThrow();
} );

it( 'fetches authenticated history and keeps it fresh for twelve hours', async () => {
	fetchMock.mockResolvedValue( { status: 'success', JSON: history } );
	const { result, unmount } = renderHook( () => usePerformanceHistory(), { wrapper } );
	await waitFor( () => expect( result.current.data ).toEqual( history ) );
	expect( fetchMock ).toHaveBeenCalledWith( {
		url: 'https://example.org/wp-json/jetpack-boost-ds/performance-history',
		method: 'GET',
		headers: { 'X-WP-Nonce': 'rest-nonce', 'X-Jetpack-WP-JS-Sync-Nonce': 'history-nonce' },
	} );
	unmount();
	const now = Date.now();
	const dateSpy = jest.spyOn( Date, 'now' ).mockReturnValue( now + 12 * 60 * 60 * 1000 - 1000 );
	const { result: cachedResult, unmount: unmountCached } = renderHook(
		() => usePerformanceHistory(),
		{ wrapper }
	);
	expect( cachedResult.current.isStale ).toBe( false );
	expect( fetchMock ).toHaveBeenCalledTimes( 1 );
	unmountCached();
	dateSpy.mockReturnValue( now + 12 * 60 * 60 * 1000 + 1000 );
	renderHook( () => usePerformanceHistory(), { wrapper } );
	await waitFor( () => expect( fetchMock ).toHaveBeenCalledTimes( 2 ) );
	dateSpy.mockRestore();
} );

it( 'surfaces malformed history envelopes and supports retrying', async () => {
	fetchMock.mockResolvedValueOnce( { status: 'success' } );
	const { result } = renderHook( () => usePerformanceHistory(), { wrapper } );
	await waitFor( () => expect( result.current.isError ).toBe( true ) );
	fetchMock.mockResolvedValueOnce( { status: 'success', JSON: null } );
	await act( async () => {
		await result.current.refetch();
	} );
	await waitFor( () => expect( result.current.data ).toBeNull() );
	expect( result.current.isError ).toBe( false );
} );

it.each( [
	[ false, true ],
	[ true, false ],
] )( 'does not fetch when enabled=%s and online=%s', ( enabled, online ) => {
	Object.defineProperty( globalThis, 'Jetpack_Boost', { value: { site: { online } } } );
	renderHook( () => usePerformanceHistory( enabled ), { wrapper } );
	expect( fetchMock ).not.toHaveBeenCalled();
} );

it( 'persists fresh-start dismissal and preserves other alert dismissals', async () => {
	fetchMock.mockImplementation( async options => ( {
		status: 'success',
		JSON:
			options.method === 'POST'
				? { score_increase: true, performance_history_fresh_start: true }
				: { score_increase: true },
	} ) );
	const { result } = renderHook(
		() => useDismissibleAlertState( 'performance_history_fresh_start' ),
		{ wrapper }
	);
	await waitFor( () => expect( fetchMock ).toHaveBeenCalledTimes( 1 ) );
	act( () => result.current[ 1 ]() );
	await waitFor( () => expect( result.current[ 0 ] ).toBe( true ) );
	expect( fetchMock ).toHaveBeenLastCalledWith( {
		url: 'https://example.org/wp-json/jetpack-boost-ds/dismissed-alerts/set',
		method: 'POST',
		headers: { 'X-WP-Nonce': 'rest-nonce', 'X-Jetpack-WP-JS-Sync-Nonce': 'alerts-nonce' },
		data: { JSON: { score_increase: true, performance_history_fresh_start: true } },
	} );
} );

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type PropsWithChildren } from 'react';
import {
	parseDataSyncEnvelope,
	parseModulesState,
	useModulesState,
	useScoreRefreshState,
} from './use-modules-state';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const fetchMock = jest.mocked( apiFetch );

function wrapper( { children }: PropsWithChildren ) {
	return createElement( QueryClientProvider, { client: queryClient }, children );
}
let queryClient: QueryClient;

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
		modules_state: { nonce: 'modules-nonce', value: {} },
	};
} );

afterEach( () => queryClient.clear() );

it.each( [ null, {}, { status: 'success' }, { status: 'error', JSON: {} } ] )(
	'rejects a malformed Data Sync envelope: %j',
	response => expect( () => parseDataSyncEnvelope( response ) ).toThrow()
);

it( 'preserves active and available separately for free and paid modules', () => {
	const states = {
		performance_history: { active: true, available: false },
		image_cdn: { active: false, available: true },
	};
	expect( parseModulesState( states ) ).toEqual( states );
	expect( () => parseModulesState( { image_cdn: { active: true } } ) ).toThrow();
} );

it( 'authenticates and revalidates bootstrapped module availability on mount', async () => {
	window.jetpack_boost_ds!.modules_state!.value = {
		performance_history: { active: true, available: false },
	};
	const paid = { performance_history: { active: true, available: true } };
	fetchMock.mockResolvedValue( { status: 'success', JSON: paid } );
	const { result } = renderHook( useModulesState, { wrapper } );
	await waitFor( () => expect( result.current.data ).toEqual( paid ) );
	expect( fetchMock ).toHaveBeenCalledWith( {
		url: 'https://example.org/wp-json/jetpack-boost-ds/modules-state',
		method: 'GET',
		headers: { 'X-WP-Nonce': 'rest-nonce', 'X-Jetpack-WP-JS-Sync-Nonce': 'modules-nonce' },
	} );
} );

it( 'surfaces malformed module responses as query errors', async () => {
	fetchMock.mockResolvedValue( { status: 'success', JSON: { lcp: { active: 'yes' } } } );
	const { result } = renderHook( useModulesState, { wrapper } );
	await waitFor( () => expect( result.current.isError ).toBe( true ) );
} );

it( 'does not request modules on an offline site', () => {
	Object.defineProperty( globalThis, 'Jetpack_Boost', { value: { site: { online: false } } } );
	renderHook( useModulesState, { wrapper } );
	expect( fetchMock ).not.toHaveBeenCalled();
} );

it( 'waits for modules and ignores image guide and object ordering in refresh configuration', () => {
	const { result, rerender } = renderHook( useScoreRefreshState, { wrapper } );
	expect( result.current ).toEqual( { config: undefined, isPending: true } );
	rerender( {
		image_cdn: { active: true, available: true },
		image_guide: { active: false, available: true },
		page_cache: { active: false, available: true },
	} );
	const config = result.current.config;
	expect( result.current.isPending ).toBe( false );
	rerender( {
		page_cache: { active: false, available: true },
		image_guide: { active: true, available: true },
		image_cdn: { active: true, available: true },
	} );
	expect( result.current.config ).toBe( config );
	expect( fetchMock ).not.toHaveBeenCalled();
} );

it( 'selects available cloud CSS over local CSS and gates generation requests offline', () => {
	const { result, rerender } = renderHook( useScoreRefreshState, {
		wrapper,
		initialProps: {
			cloud_css: { active: false, available: true },
			critical_css: { active: true, available: true },
			lcp: { active: false, available: true },
		},
	} );
	expect( result.current.isPending ).toBe( false );
	expect( fetchMock ).not.toHaveBeenCalled();
	Object.defineProperty( globalThis, 'Jetpack_Boost', { value: { site: { online: false } } } );
	rerender( {
		cloud_css: { active: false, available: false },
		critical_css: { active: true, available: true },
		lcp: { active: true, available: true },
	} );
	expect( result.current ).toEqual( { config: undefined, isPending: true } );
	expect( fetchMock ).not.toHaveBeenCalled();
} );

it( 'polls pending LCP every two seconds, updates its stamp, and polls settled state every thirty seconds', async () => {
	jest.useFakeTimers();
	try {
		window.jetpack_boost_ds!.lcp_state = {
			nonce: 'lcp-nonce',
			value: { status: 'pending', updated: 1 },
		};
		fetchMock.mockResolvedValueOnce( {
			status: 'success',
			JSON: { status: 'pending', updated: 1 },
		} );
		fetchMock.mockResolvedValue( { status: 'success', JSON: { status: 'analyzed', updated: 2 } } );
		const { result } = renderHook(
			() => useScoreRefreshState( { lcp: { active: true, available: true } } ),
			{ wrapper }
		);
		const pendingConfig = result.current.config;
		expect( result.current.isPending ).toBe( true );
		await act( async () => {
			await jest.advanceTimersByTimeAsync( 1 );
		} );
		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		await act( async () => {
			await jest.advanceTimersByTimeAsync( 2000 );
		} );
		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
		expect( result.current.isPending ).toBe( false );
		expect( result.current.config ).not.toBe( pendingConfig );
		await act( async () => {
			await jest.advanceTimersByTimeAsync( 29000 );
		} );
		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
		await act( async () => {
			await jest.advanceTimersByTimeAsync( 999 );
		} );
		expect( fetchMock ).toHaveBeenCalledTimes( 3 );
		expect( fetchMock ).toHaveBeenLastCalledWith( {
			url: 'https://example.org/wp-json/jetpack-boost-ds/lcp-state',
			method: 'GET',
			headers: { 'X-WP-Nonce': 'rest-nonce', 'X-Jetpack-WP-JS-Sync-Nonce': 'lcp-nonce' },
		} );
	} finally {
		jest.useRealTimers();
	}
} );

it( 'waits for missing CSS bootstrap and blocks regeneration on malformed state responses', async () => {
	window.jetpack_boost_ds!.critical_css_state = { nonce: 'css-nonce', value: null };
	fetchMock.mockResolvedValue( { status: 'success', JSON: { status: 'invalid' } } );
	const { result } = renderHook(
		() => useScoreRefreshState( { critical_css: { active: true, available: true } } ),
		{ wrapper }
	);
	expect( result.current ).toEqual( { config: undefined, isPending: true } );
	await waitFor( () =>
		expect( queryClient.getQueryState( [ 'jetpack_boost', 'critical_css_state' ] )?.status ).toBe(
			'error'
		)
	);
	expect( result.current ).toEqual( { config: undefined, isPending: true } );
} );

it( 'treats completed generation errors as settled so their updated stamps can refresh scores', () => {
	window.jetpack_boost_ds!.critical_css_state = {
		nonce: 'css-nonce',
		value: { status: 'error', updated: 3 },
	};
	fetchMock.mockResolvedValue( { status: 'success', JSON: { status: 'error', updated: 3 } } );
	const { result } = renderHook(
		() => useScoreRefreshState( { critical_css: { active: true, available: true } } ),
		{ wrapper }
	);
	expect( result.current.isPending ).toBe( false );
	expect( result.current.config ).toBe( JSON.stringify( [ [ [ 'critical_css', true ] ], 3, 0 ] ) );
} );

it( 'preserves the server message from Data Sync errors', async () => {
	fetchMock.mockResolvedValue( {
		status: 'error',
		message: 'History is temporarily unavailable.',
	} );
	const { result } = renderHook( useModulesState, { wrapper } );
	await waitFor( () => expect( result.current.isError ).toBe( true ) );
	expect( result.current.error?.message ).toBe( 'History is temporarily unavailable.' );
} );

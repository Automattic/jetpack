import { requestSpeedScores } from '@automattic/jetpack-boost-score-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useSpeedScores } from './use-speed-scores';

declare global {
	interface Window {
		Jetpack_Boost: typeof Jetpack_Boost;
	}
}

jest.mock( '@automattic/jetpack-boost-score-api', () => ( {
	...jest.requireActual( '@automattic/jetpack-boost-score-api' ),
	requestSpeedScores: jest.fn(),
} ) );
jest.mock( '../../../app/assets/src/js/lib/utils/analytics', () => ( {
	recordBoostEvent: jest.fn(),
} ) );

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
let queryClient: QueryClient;
function wrapper( { children }: PropsWithChildren ) {
	return createElement( QueryClientProvider, { client: queryClient }, children );
}

beforeEach( () => {
	queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false, gcTime: Infinity } },
	} );
	jest
		.mocked( apiFetch )
		.mockReset()
		.mockImplementation( async () => ( {
			status: 'success',
			JSON: window.jetpack_boost_ds?.cornerstone_pages_properties?.value,
		} ) );
	jest
		.mocked( requestSpeedScores )
		.mockReset()
		.mockResolvedValue( {
			current: { mobile: 81, desktop: 91 },
			noBoost: null,
			isStale: false,
		} );
	Object.assign( window, {
		Jetpack_Boost: { site: { url: 'https://example.org', online: true } },
		wpApiSettings: { root: 'https://example.org/wp-json/', nonce: 'wp-nonce' },
		jetpack_boost_ds: {
			rest_api: { value: 'https://example.org/wp-json/jetpack-boost-ds', nonce: 'wp-nonce' },
		},
	} );
} );

afterEach( () => queryClient.clear() );

test( 'preserves the exact cornerstone URL for cached and regenerated scores', async () => {
	window.jetpack_boost_ds!.cornerstone_pages_properties = {
		nonce: 'cornerstone-nonce',
		value: { predefined_pages: [ 'https://example.org/', 'https://example.org/second/' ] },
	};
	const { result } = renderHook( () => useSpeedScores(), { wrapper } );
	await waitFor( () => expect( result.current[ 0 ].status ).toBe( 'loaded' ) );
	expect( requestSpeedScores ).toHaveBeenCalledWith(
		false,
		wpApiSettings.root,
		'https://example.org/',
		wpApiSettings.nonce
	);
	await act( async () => result.current[ 1 ]( true ) );
	expect( requestSpeedScores ).toHaveBeenLastCalledWith(
		true,
		wpApiSettings.root,
		'https://example.org/',
		wpApiSettings.nonce
	);
} );

test.each( [ undefined, { predefined_pages: [] }, { predefined_pages: [ '' ] } ] )(
	'falls back to the site URL when no first predefined page exists: %p',
	async value => {
		window.jetpack_boost_ds!.cornerstone_pages_properties = { nonce: 'cornerstone-nonce', value };
		const { result } = renderHook( () => useSpeedScores(), { wrapper } );
		await waitFor( () => expect( result.current[ 0 ].status ).toBe( 'loaded' ) );
		expect( requestSpeedScores ).toHaveBeenCalledWith(
			false,
			wpApiSettings.root,
			'https://example.org',
			wpApiSettings.nonce
		);
	}
);

test( 'keeps offline sites idle, including manual refresh', async () => {
	window.Jetpack_Boost.site.online = false;
	const { result } = renderHook( () => useSpeedScores(), { wrapper } );
	expect( result.current[ 0 ].status ).toBe( 'offline' );
	await act( async () => result.current[ 1 ]( true ) );
	expect( requestSpeedScores ).not.toHaveBeenCalled();
} );

test( 'retains scores on refresh failure and recovers on retry', async () => {
	const { result } = renderHook( () => useSpeedScores(), { wrapper } );
	await waitFor( () => expect( result.current[ 0 ].status ).toBe( 'loaded' ) );
	jest.mocked( requestSpeedScores ).mockRejectedValueOnce( new Error( 'Service unavailable' ) );
	await act( async () => result.current[ 1 ]( true ) );
	expect( result.current[ 0 ] ).toEqual(
		expect.objectContaining( {
			status: 'error',
			hasScores: true,
			scores: { current: { mobile: 81, desktop: 91 }, noBoost: null, isStale: false },
		} )
	);
	await act( async () => result.current[ 1 ]( true ) );
	expect( result.current[ 0 ].status ).toBe( 'loaded' );
	expect( result.current[ 0 ].error ).toBeUndefined();
} );

test( 'regenerates after changed module configuration settles and waits two seconds', async () => {
	jest.useFakeTimers();
	try {
		const { rerender } = renderHook( state => useSpeedScores( state ), {
			wrapper,
			initialProps: { config: 'initial', isPending: false },
		} );
		await act( async () => {
			await Promise.resolve();
		} );
		rerender( { config: 'changed', isPending: true } );
		await act( async () => jest.advanceTimersByTimeAsync( 3000 ) );
		expect( requestSpeedScores ).toHaveBeenCalledTimes( 1 );
		rerender( { config: 'changed', isPending: false } );
		await act( async () => jest.advanceTimersByTimeAsync( 1999 ) );
		expect( requestSpeedScores ).toHaveBeenCalledTimes( 1 );
		await act( async () => jest.advanceTimersByTimeAsync( 1 ) );
		expect( requestSpeedScores ).toHaveBeenCalledTimes( 2 );
		expect( requestSpeedScores ).toHaveBeenLastCalledWith(
			true,
			wpApiSettings.root,
			'https://example.org',
			wpApiSettings.nonce
		);
	} finally {
		jest.useRealTimers();
	}
} );

test( 'refreshes scores for live cornerstone changes on mount and refetch', async () => {
	window.jetpack_boost_ds!.cornerstone_pages_properties = {
		nonce: 'cornerstone-nonce',
		value: { predefined_pages: [ 'https://example.org/old/' ] },
	};
	jest.mocked( apiFetch ).mockResolvedValue( {
		status: 'success',
		JSON: { predefined_pages: [ 'https://example.org/current/' ] },
	} );
	renderHook( () => useSpeedScores(), { wrapper } );
	await waitFor( () =>
		expect( requestSpeedScores ).toHaveBeenLastCalledWith(
			false,
			wpApiSettings.root,
			'https://example.org/current/',
			wpApiSettings.nonce
		)
	);
	jest.mocked( apiFetch ).mockResolvedValue( {
		status: 'success',
		JSON: { predefined_pages: [ 'https://example.org/updated/' ] },
	} );
	await act( async () => {
		await queryClient.refetchQueries( { queryKey: [ 'cornerstone_pages_properties' ] } );
	} );
	await waitFor( () =>
		expect( requestSpeedScores ).toHaveBeenLastCalledWith(
			false,
			wpApiSettings.root,
			'https://example.org/updated/',
			wpApiSettings.nonce
		)
	);
} );

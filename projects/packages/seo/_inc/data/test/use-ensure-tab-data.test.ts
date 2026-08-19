import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

// True-ESM Jest: mock the REST + preload edges; `@wordpress/element` stays real
// so the hook's state and effect behave.
const mockApiFetch = jest.fn< ( options: unknown ) => Promise< unknown > >();
const getPreloaded = jest.fn< ( path: string ) => unknown >();
const writePreloaded = jest.fn();

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '../get-preloaded', () => ( { getPreloaded, writePreloaded } ) );

const { default: useEnsureTabData } = await import( '../use-ensure-tab-data' );

const PATH = '/jetpack/v4/seo/overview';

describe( 'useEnsureTabData', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'is ready immediately and fetches nothing when every path is preloaded', () => {
		getPreloaded.mockReturnValue( { ready: true } );

		const { result } = renderHook( () => useEnsureTabData( [ { path: PATH } ] ) );

		expect( result.current.status ).toBe( 'ready' );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'fetches a missing path, caches and seeds it, then becomes ready', async () => {
		getPreloaded.mockReturnValue( undefined );
		mockApiFetch.mockResolvedValue( { fetched: true } );
		const seed = jest.fn();

		const { result } = renderHook( () => useEnsureTabData( [ { path: PATH, seed } ] ) );

		expect( result.current.status ).toBe( 'loading' );
		await waitFor( () => expect( result.current.status ).toBe( 'ready' ) );

		expect( mockApiFetch ).toHaveBeenCalledWith( { path: PATH } );
		expect( writePreloaded ).toHaveBeenCalledWith( PATH, { fetched: true } );
		expect( seed ).toHaveBeenCalledWith( { fetched: true } );
	} );

	it( 'surfaces the error state after the silent retries fail, and retry() recovers', async () => {
		getPreloaded.mockReturnValue( undefined );
		mockApiFetch.mockRejectedValue( new Error( 'network' ) );

		const { result } = renderHook( () => useEnsureTabData( [ { path: PATH } ] ) );

		await waitFor( () => expect( result.current.status ).toBe( 'error' ) );
		// One initial attempt plus two silent retries.
		expect( mockApiFetch ).toHaveBeenCalledTimes( 3 );

		mockApiFetch.mockResolvedValue( { ok: true } );
		act( () => result.current.retry() );

		await waitFor( () => expect( result.current.status ).toBe( 'ready' ) );
	} );
} );

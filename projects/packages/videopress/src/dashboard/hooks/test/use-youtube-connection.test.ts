import { act, renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import {
	CONNECTION_POLL_INTERVAL_MS,
	CONNECTION_QUERY_SEGMENT,
	IMPORT_QUERY_KEY,
	useYouTubeConnection,
} from '../use-youtube-connection';

const CONNECTION_PATH = '/jetpack/v4/videopress/import/youtube/connection';

const RAW_CONNECTION = {
	connected: true,
	account_name: 'Lens & Latitude',
	profile_image: 'https://example.com/avatar.jpg',
	connect_url: null,
};

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'useYouTubeConnection', () => {
	it( 'fetches the connection and normalizes it to camelCase', async () => {
		const mock = mockApiFetch( ( { path } ) => {
			expect( path ).toBe( CONNECTION_PATH );
			return RAW_CONNECTION;
		} );

		const { result } = renderHook( () => useYouTubeConnection(), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.connection ).toEqual( {
			connected: true,
			accountName: 'Lens & Latitude',
			profileImage: 'https://example.com/avatar.jpg',
			connectUrl: null,
		} );
		expect( mock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'surfaces a fetch failure as isError', async () => {
		mockApiFetch( () => {
			throw new Error( 'nope' );
		} );

		const { result } = renderHook( () => useYouTubeConnection(), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.connection ).toBeUndefined();
		expect( ( result.current.error as Error ).message ).toBe( 'nope' );
	} );

	it( 'does not poll by default', async () => {
		jest.useFakeTimers();
		const mock = mockApiFetch( () => RAW_CONNECTION );

		const { result } = renderHook( () => useYouTubeConnection(), {
			wrapper: createTestWrapper(),
		} );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 0 );
		} );
		expect( result.current.connection?.connected ).toBe( true );
		expect( mock ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( CONNECTION_POLL_INTERVAL_MS * 2 );
		} );
		expect( mock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'refetches on the poll interval while polling is true', async () => {
		jest.useFakeTimers();
		const mock = mockApiFetch( () => RAW_CONNECTION );

		renderHook( () => useYouTubeConnection( { polling: true } ), {
			wrapper: createTestWrapper(),
		} );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( 0 );
		} );
		expect( mock ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( CONNECTION_POLL_INTERVAL_MS );
		} );
		expect( mock ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'disconnect DELETEs the connection and invalidates the import branch', async () => {
		const calls: Array< { path?: string; method?: string } > = [];
		mockApiFetch( options => {
			calls.push( options );
			if ( options.method === 'DELETE' ) {
				return { deleted: true };
			}
			return RAW_CONNECTION;
		} );

		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const { result } = renderHook( () => useYouTubeConnection(), {
			wrapper: createTestWrapper( client ),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		await act( async () => {
			await result.current.disconnect();
		} );

		expect( calls ).toContainEqual(
			expect.objectContaining( { path: CONNECTION_PATH, method: 'DELETE' } )
		);
		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ IMPORT_QUERY_KEY ] } );
	} );

	it( 'rejects the disconnect promise and skips invalidation on failure', async () => {
		mockApiFetch( ( { method } ) => {
			if ( method === 'DELETE' ) {
				throw new Error( 'cannot disconnect' );
			}
			return RAW_CONNECTION;
		} );

		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const { result } = renderHook( () => useYouTubeConnection(), {
			wrapper: createTestWrapper( client ),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		invalidateSpy.mockClear();

		await act( async () => {
			await expect( result.current.disconnect() ).rejects.toThrow( 'cannot disconnect' );
		} );

		expect( invalidateSpy ).not.toHaveBeenCalled();
		await waitFor( () => expect( result.current.disconnectError ).toBeInstanceOf( Error ) );
	} );

	it( 'exposes the expected query key segments', () => {
		expect( IMPORT_QUERY_KEY ).toBe( 'jetpack-videopress-import' );
		expect( CONNECTION_QUERY_SEGMENT ).toBe( 'connection' );
	} );
} );

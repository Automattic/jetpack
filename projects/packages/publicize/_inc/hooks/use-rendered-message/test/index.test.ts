import { renderHook, act, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useRenderedMessage from '../';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'useRenderedMessage', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( { rendered_message: 'Rendered' } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'does not fetch when disabled', async () => {
		const { result } = renderHook( () =>
			useRenderedMessage( { enabled: false, postId: 1, network: 'x', message: 'hi' } )
		);

		await act( async () => {
			jest.runAllTimers();
		} );

		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( result.current.rendered ).toBeNull();
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'does not fetch without a post id or network', async () => {
		renderHook( () =>
			useRenderedMessage( { enabled: true, postId: 0, network: 'x', message: 'hi' } )
		);
		renderHook( () =>
			useRenderedMessage( { enabled: true, postId: 1, network: '', message: 'hi' } )
		);

		await act( async () => {
			jest.runAllTimers();
		} );

		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'posts to /publicize/render-message and returns rendered_message', async () => {
		const { result } = renderHook( () =>
			useRenderedMessage( {
				enabled: true,
				postId: 42,
				network: 'x',
				message: '{title} {url}',
			} )
		);

		await act( async () => {
			jest.runAllTimers();
		} );

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: 'wpcom/v2/publicize/render-message',
				method: 'POST',
				data: { post_id: 42, network: 'x', message: '{title} {url}' },
			} )
		);
		expect( result.current.rendered ).toBe( 'Rendered' );
	} );

	it( 'debounces when the message string changes', async () => {
		const { rerender } = renderHook(
			( props: Parameters< typeof useRenderedMessage >[ 0 ] ) => useRenderedMessage( props ),
			{ initialProps: { enabled: true, postId: 1, network: 'x', message: 'first' } }
		);

		await act( async () => {
			jest.runAllTimers();
		} );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );

		rerender( { enabled: true, postId: 1, network: 'x', message: 'second' } );

		// Still only the first call — debounced.
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );

		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	it( 'keeps the previous rendered value on error', async () => {
		const { result, rerender } = renderHook(
			( props: Parameters< typeof useRenderedMessage >[ 0 ] ) => useRenderedMessage( props ),
			{ initialProps: { enabled: true, postId: 1, network: 'x', message: 'a' } }
		);

		await act( async () => {
			jest.runAllTimers();
		} );

		await waitFor( () => {
			expect( result.current.rendered ).toBe( 'Rendered' );
		} );

		mockApiFetch.mockRejectedValueOnce( new Error( 'boom' ) );
		rerender( { enabled: true, postId: 1, network: 'x', message: 'b' } );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( result.current.rendered ).toBe( 'Rendered' );
	} );
} );

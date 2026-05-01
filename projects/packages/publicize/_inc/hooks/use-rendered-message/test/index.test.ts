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
			useRenderedMessage( {
				enabled: false,
				postId: 1,
				network: 'x',
				message: 'hi',
				isSocialPost: false,
			} )
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
			useRenderedMessage( {
				enabled: true,
				postId: 0,
				network: 'x',
				message: 'hi',
				isSocialPost: false,
			} )
		);
		renderHook( () =>
			useRenderedMessage( {
				enabled: true,
				postId: 1,
				network: '',
				message: 'hi',
				isSocialPost: false,
			} )
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
				isSocialPost: false,
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
				data: { post_id: 42, network: 'x', message: '{title} {url}', is_social_post: false },
			} )
		);
		expect( result.current.rendered ).toBe( 'Rendered' );
	} );

	it( 'forwards char_limit to the endpoint when provided', async () => {
		renderHook( () =>
			useRenderedMessage( {
				enabled: true,
				postId: 42,
				network: 'tumblr',
				message: '{title} {url}',
				isSocialPost: false,
				charLimit: 400,
			} )
		);

		await act( async () => {
			jest.runAllTimers();
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: {
					post_id: 42,
					network: 'tumblr',
					message: '{title} {url}',
					is_social_post: false,
					char_limit: 400,
				},
			} )
		);
	} );

	it( 'omits char_limit from the request when not provided', async () => {
		renderHook( () =>
			useRenderedMessage( {
				enabled: true,
				postId: 42,
				network: 'x',
				message: '{title}',
				isSocialPost: false,
			} )
		);

		await act( async () => {
			jest.runAllTimers();
		} );

		const call = mockApiFetch.mock.calls[ 0 ]?.[ 0 ] as { data?: Record< string, unknown > };
		expect( call?.data ).not.toHaveProperty( 'char_limit' );
	} );

	it( 'sends is_social_post=true when the post is shared as a social post', async () => {
		renderHook( () =>
			useRenderedMessage( {
				enabled: true,
				postId: 42,
				network: 'x',
				message: '{title}',
				isSocialPost: true,
			} )
		);

		await act( async () => {
			jest.runAllTimers();
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: { post_id: 42, network: 'x', message: '{title}', is_social_post: true },
			} )
		);
	} );

	it( 'refetches immediately (no debounce) when isSocialPost toggles', async () => {
		const { rerender } = renderHook(
			( props: Parameters< typeof useRenderedMessage >[ 0 ] ) => useRenderedMessage( props ),
			{
				initialProps: {
					enabled: true,
					postId: 1,
					network: 'x',
					message: 'same',
					isSocialPost: false,
				},
			}
		);

		await act( async () => {
			jest.runAllTimers();
		} );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );

		rerender( { enabled: true, postId: 1, network: 'x', message: 'same', isSocialPost: true } );

		// No timer advance needed — non-message changes fire on the next tick.
		await act( async () => {
			jest.advanceTimersByTime( 0 );
		} );

		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
		} );

		expect( mockApiFetch ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				data: { post_id: 1, network: 'x', message: 'same', is_social_post: true },
			} )
		);
	} );

	it( 'debounces when the message string changes', async () => {
		const { rerender } = renderHook(
			( props: Parameters< typeof useRenderedMessage >[ 0 ] ) => useRenderedMessage( props ),
			{
				initialProps: {
					enabled: true,
					postId: 1,
					network: 'x',
					message: 'first',
					isSocialPost: false,
				},
			}
		);

		await act( async () => {
			jest.runAllTimers();
		} );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );

		rerender( {
			enabled: true,
			postId: 1,
			network: 'x',
			message: 'second',
			isSocialPost: false,
		} );

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
			{
				initialProps: {
					enabled: true,
					postId: 1,
					network: 'x',
					message: 'a',
					isSocialPost: false,
				},
			}
		);

		await act( async () => {
			jest.runAllTimers();
		} );

		await waitFor( () => {
			expect( result.current.rendered ).toBe( 'Rendered' );
		} );

		mockApiFetch.mockRejectedValueOnce( new Error( 'boom' ) );
		rerender( { enabled: true, postId: 1, network: 'x', message: 'b', isSocialPost: false } );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );

		await waitFor( () => {
			expect( result.current.isLoading ).toBe( false );
		} );

		expect( result.current.rendered ).toBe( 'Rendered' );
	} );
} );

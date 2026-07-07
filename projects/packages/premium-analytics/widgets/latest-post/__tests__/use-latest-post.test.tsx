/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { useLatestPost } from '../use-latest-post';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

function wrapper( { children }: { children: ReactNode } ) {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );

	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

describe( 'useLatestPost', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
	} );

	it( 'reads content locally and layers views, likes, and comments from stats/post', async () => {
		mockApiFetch.mockImplementation(
			( { path = '', url = '' }: { path?: string; url?: string } ) => {
				const target = path || url;

				if ( target.startsWith( '/wp/v2/posts' ) ) {
					return Promise.resolve( [
						{
							id: 779,
							title: { rendered: 'Hello world' },
							link: 'https://example.com/hello-world/',
							date: '2026-06-22T10:00:00',
						},
					] );
				}

				if ( target.includes( 'stats/post/' ) ) {
					return Promise.resolve( {
						views: 3820,
						like_count: 24,
						post: { comment_count: 8 },
					} );
				}

				return Promise.resolve( {} );
			}
		);

		const { result } = renderHook( () => useLatestPost(), { wrapper } );

		await waitFor( () =>
			expect( result.current.post ).toEqual( {
				id: 779,
				title: 'Hello world',
				url: 'https://example.com/hello-world/',
				date: '2026-06-22T10:00:00',
				imageUrl: '',
				imageAlt: '',
				views: 3820,
				likeCount: 24,
				commentCount: 8,
			} )
		);
		expect( result.current.isError ).toBe( false );
	} );

	it( 'returns a null post when the site has no published post', async () => {
		mockApiFetch.mockImplementation(
			( { path = '', url = '' }: { path?: string; url?: string } ) => {
				const target = path || url;

				if ( target.startsWith( '/wp/v2/posts' ) ) {
					return Promise.resolve( [] );
				}

				return Promise.resolve( {} );
			}
		);

		const { result } = renderHook( () => useLatestPost(), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.post ).toBeNull();
	} );

	it( 'still renders content with zeroed metrics when stats/post fails (private site)', async () => {
		mockApiFetch.mockImplementation(
			( { path = '', url = '' }: { path?: string; url?: string } ) => {
				const target = path || url;

				if ( target.startsWith( '/wp/v2/posts' ) ) {
					return Promise.resolve( [
						{
							id: 779,
							title: { rendered: 'Hello world' },
							link: 'https://example.com/hello-world/',
							date: '2026-06-22T10:00:00',
						},
					] );
				}

				return Promise.reject( new Error( 'User cannot access this private blog.' ) );
			}
		);

		const { result } = renderHook( () => useLatestPost(), { wrapper } );

		await waitFor( () =>
			expect( result.current.post ).toEqual( {
				id: 779,
				title: 'Hello world',
				url: 'https://example.com/hello-world/',
				date: '2026-06-22T10:00:00',
				imageUrl: '',
				imageAlt: '',
				views: 0,
				likeCount: 0,
				commentCount: 0,
			} )
		);
		expect( result.current.isError ).toBe( false );
	} );
} );

/**
 * External dependencies
 */
import { queryClient, type ReportParams } from '@jetpack-premium-analytics/data';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { queryClientWrapper as wrapper } from '../../test-utils';
import { usePopularPost } from '../use-popular-post';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const reportParams = { from: '2026-06-01', to: '2026-06-30' } as ReportParams;

// A multi-day range is requested with `summarize=1`, so the rows live under
// `summary.postviews`.
const topPostsResponse = {
	date: '2026-06-30',
	period: 'day',
	days: {},
	summary: {
		postviews: [
			// A page outranks the top post: the hook must skip it.
			{ id: 9, title: 'About', type: 'page', href: 'https://example.com/about/', views: 900 },
			{
				id: 7,
				title: 'Winning post',
				type: 'post',
				href: 'https://example.com/winning-post/',
				date: '2026-06-02',
				views: 420,
			},
			{
				id: 8,
				title: 'Runner up',
				type: 'post',
				href: 'https://example.com/runner-up/',
				date: '2026-06-03',
				views: 120,
			},
		],
		total_views: 1440,
	},
};

const postContentResponse = [
	{
		id: 7,
		title: { rendered: 'Winning &#038; popular post' },
		link: 'https://example.com/winning-post/',
		date: '2026-06-02T08:00:00',
		_embedded: {
			'wp:featuredmedia': [ { source_url: 'https://example.com/hero.jpg', alt_text: 'Hero' } ],
		},
	},
];

// `post.ID` is what ties a metrics response to the post the card is showing —
// the hook refuses to display metrics it cannot attribute to the current winner.
const postStatsResponse = {
	views: 9999,
	like_count: 12,
	post: { ID: 7, comment_count: 4 },
};

const runnerUpStatsResponse = {
	views: 3333,
	like_count: 34,
	post: { ID: 8, comment_count: 5 },
};

type MockedFetchArgs = { path?: string; url?: string };

function mockEndpoints( { failPostStats = false }: { failPostStats?: boolean } = {} ) {
	mockApiFetch.mockImplementation( ( { path = '', url = '' }: MockedFetchArgs ) => {
		const target = path || url;

		if ( target.includes( 'stats/top-posts' ) ) {
			return Promise.resolve( topPostsResponse );
		}

		if ( target.includes( 'stats/post/' ) ) {
			// A 403 rather than a bare Error: the shared retry policy retries with
			// exponential backoff, so a retryable rejection would leave the card in
			// its skeleton for the whole backoff window instead of settling.
			return failPostStats
				? Promise.reject( {
						error: 'unauthorized',
						message: 'User cannot access this private blog.',
						status: 403,
				  } )
				: Promise.resolve( postStatsResponse );
		}

		if ( target.startsWith( '/wp/v2/posts' ) ) {
			return Promise.resolve( postContentResponse );
		}

		return Promise.resolve( {} );
	} );
}

describe( 'usePopularPost', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'picks the most-viewed post and shows all-time metrics for it', async () => {
		mockEndpoints();

		const { result } = renderHook( () => usePopularPost( reportParams ), { wrapper } );

		await waitFor( () =>
			expect( result.current.post ).toEqual( {
				id: 7,
				// Core content wins over the report row: it is entity-decoded.
				title: 'Winning & popular post',
				url: 'https://example.com/winning-post/',
				date: '2026-06-02T08:00:00',
				imageUrl: 'https://example.com/hero.jpg',
				imageAlt: 'Hero',
				// All three tiles share one window: the all-time `stats/post` response.
				// The report row's period views (420) deliberately do not surface.
				views: 9999,
				likeCount: 12,
				commentCount: 4,
			} )
		);
		expect( result.current.isError ).toBe( false );
	} );

	it( 'requests the resolved post from the core posts endpoint', async () => {
		mockEndpoints();

		renderHook( () => usePopularPost( reportParams ), { wrapper } );

		await waitFor( () => {
			const contentPath = mockApiFetch.mock.calls
				.map( ( [ options ] ) => ( options as MockedFetchArgs ).path ?? '' )
				.find( path => path.startsWith( '/wp/v2/posts' ) );

			expect( contentPath ).toContain( 'include=7' );
		} );
	} );

	it( 'still renders the post, with metrics unknown, when stats/post fails', async () => {
		mockEndpoints( { failPostStats: true } );

		const { result } = renderHook( () => usePopularPost( reportParams ), { wrapper } );

		// The ranking still resolved, so the card keeps its title and image. Every
		// metric comes from the failed request, so all three are left unknown rather
		// than zeroed — a 403 on a private site must not read as "0 likes". The
		// loading state must also settle: a failed metrics request is the one case
		// where the identity guard could otherwise skeleton the card forever.
		await waitFor( () => expect( result.current.isLoading ).toBe( false ), { timeout: 5000 } );
		expect( result.current.post?.title ).toBe( 'Winning & popular post' );
		expect( result.current.post?.views ).toBeUndefined();
		expect( result.current.post?.likeCount ).toBeUndefined();
		expect( result.current.post?.commentCount ).toBeUndefined();
		// The ranking request succeeded, so the widget itself is not in error.
		expect( result.current.isError ).toBe( false );
	} );

	it( 'returns a null post when the period has no post views', async () => {
		mockApiFetch.mockImplementation( ( { path = '', url = '' }: MockedFetchArgs ) => {
			const target = path || url;

			if ( target.includes( 'stats/top-posts' ) ) {
				return Promise.resolve( {
					date: '2026-06-30',
					period: 'day',
					days: {},
					summary: { postviews: [] },
				} );
			}

			return Promise.resolve( {} );
		} );

		const { result } = renderHook( () => usePopularPost( reportParams ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.post ).toBeNull();
	} );

	it( 'never attributes the previous winner’s metrics to a new one', async () => {
		let releaseRunnerUpStats: () => void = () => {};
		const runnerUpStats = new Promise( resolve => {
			releaseRunnerUpStats = () => resolve( runnerUpStatsResponse );
		} );

		mockApiFetch.mockImplementation( ( { path = '', url = '' }: MockedFetchArgs ) => {
			const target = path || url;

			if ( target.includes( 'stats/top-posts' ) ) {
				// The July range promotes the runner up to the winning post.
				return Promise.resolve(
					target.includes( '2026-07' )
						? {
								...topPostsResponse,
								summary: {
									...topPostsResponse.summary,
									postviews: [
										{
											id: 8,
											title: 'Runner up',
											type: 'post',
											href: 'https://example.com/runner-up/',
											date: '2026-06-03',
											views: 700,
										},
									],
								},
						  }
						: topPostsResponse
				);
			}

			// Held open so the assertions run while the new winner's metrics are
			// still in flight — the window the bug lived in.
			if ( target.includes( 'stats/post/8' ) ) {
				return runnerUpStats;
			}

			if ( target.includes( 'stats/post/' ) ) {
				return Promise.resolve( postStatsResponse );
			}

			if ( target.startsWith( '/wp/v2/posts' ) ) {
				return Promise.resolve( postContentResponse );
			}

			return Promise.resolve( {} );
		} );

		const { result, rerender } = renderHook(
			( { params }: { params: ReportParams } ) => usePopularPost( params ),
			{ wrapper, initialProps: { params: reportParams } }
		);

		await waitFor( () => expect( result.current.post?.likeCount ).toBe( 12 ) );

		rerender( { params: { from: '2026-07-01', to: '2026-07-31' } as ReportParams } );

		await waitFor( () => expect( result.current.post?.id ).toBe( 8 ) );

		// The winner changed while its metrics are still loading. The Stats query
		// keeps the previous key's payload through `placeholderData`, so this is
		// exactly where post 7's engagement used to leak onto post 8.
		expect( result.current.post?.views ).not.toBe( 9999 );
		expect( result.current.post?.likeCount ).not.toBe( 12 );
		expect( result.current.post?.commentCount ).not.toBe( 4 );
		expect( result.current.isLoading ).toBe( true );

		// Resolving the held request updates state, so let React flush it here
		// rather than leaking the update into a later test.
		await act( async () => {
			releaseRunnerUpStats();
			await runnerUpStats;
		} );

		await waitFor( () => expect( result.current.post?.likeCount ).toBe( 34 ) );
		expect( result.current.post?.views ).toBe( 3333 );
		expect( result.current.post?.commentCount ).toBe( 5 );
	} );

	it( 'does not request the comparison window it never renders', async () => {
		mockEndpoints();

		const { result } = renderHook(
			() =>
				usePopularPost( {
					...reportParams,
					comp: '1',
					compare_from: '2026-05-01',
					compare_to: '2026-05-31',
				} as ReportParams ),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.post?.id ).toBe( 7 ) );

		const topPostsPaths = mockApiFetch.mock.calls
			.map( ( [ options ] ) => {
				const { path, url } = options as MockedFetchArgs;
				return path || url || '';
			} )
			.filter( target => target.includes( 'stats/top-posts' ) );

		expect( topPostsPaths ).toHaveLength( 1 );
		expect( topPostsPaths.every( target => ! target.includes( '2026-05' ) ) ).toBe( true );
	} );
} );

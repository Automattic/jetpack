/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { queryClientWrapper as wrapper } from '../../test-utils';
import { usePopularPost } from '../use-popular-post';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

function topPostsRequestPaths(): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => {
			const { path, url } = options as MockedFetchArgs;
			return path || url || '';
		} )
		.filter( target => target.includes( 'stats/top-posts' ) );
}

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

		const { result } = renderHook( () => usePopularPost(), { wrapper } );

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

		renderHook( () => usePopularPost(), { wrapper } );

		await waitFor( () => {
			const contentPath = mockApiFetch.mock.calls
				.map( ( [ options ] ) => ( options as MockedFetchArgs ).path ?? '' )
				.find( path => path.startsWith( '/wp/v2/posts' ) );

			expect( contentPath ).toContain( 'include=7' );
		} );
	} );

	it( 'still renders the post, with metrics unknown, when stats/post fails', async () => {
		mockEndpoints( { failPostStats: true } );

		const { result } = renderHook( () => usePopularPost(), { wrapper } );

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

		const { result } = renderHook( () => usePopularPost(), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.post ).toBeNull();
	} );

	it( 'never attributes the previous winner’s metrics to a new one', async () => {
		let releaseRunnerUpStats: () => void = () => {};
		const runnerUpStats = new Promise( resolve => {
			releaseRunnerUpStats = () => resolve( runnerUpStatsResponse );
		} );
		// The window is pinned, so the winner can only change under a fixed request:
		// the site's own data moved, and a refetch picked the new leader up.
		let hasRankedOnce = false;

		mockApiFetch.mockImplementation( ( { path = '', url = '' }: MockedFetchArgs ) => {
			const target = path || url;

			if ( target.includes( 'stats/top-posts' ) ) {
				if ( ! hasRankedOnce ) {
					hasRankedOnce = true;
					return Promise.resolve( topPostsResponse );
				}

				return Promise.resolve( {
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
				} );
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

		const { result } = renderHook( () => usePopularPost(), { wrapper } );

		await waitFor( () => expect( result.current.post?.likeCount ).toBe( 12 ) );

		act( () => result.current.refetch() );

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

	describe( 'the ranking window', () => {
		// The window is resolved from "now" in the *site* timezone, so pin both
		// rather than letting the machine's clock and zone decide what the request
		// should look like.
		const NOW = new Date( '2026-08-27T12:00:00.000Z' );
		let defaultSettings: ReturnType< typeof getSettings >;

		beforeEach( () => {
			defaultSettings = getSettings();
			setSettings( {
				...defaultSettings,
				timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
			} );
			jest.useFakeTimers();
			jest.setSystemTime( NOW );
		} );

		afterEach( () => {
			jest.useRealTimers();
			setSettings( defaultSettings );
		} );

		it( 'ranks over the last 12 months, not the dashboard range', async () => {
			mockEndpoints();

			const { result } = renderHook( () => usePopularPost(), { wrapper } );

			await waitFor( () => expect( result.current.post?.id ).toBe( 7 ) );

			const [ rankingPath ] = topPostsRequestPaths();
			const ranking = decodeURIComponent( rankingPath );

			// Whole days: from the start of the day 12 months back, through the end
			// of yesterday.
			expect( ranking ).toContain( 'start_date=2025-08-27T00:00:00' );
			expect( ranking ).toContain( 'date=2026-08-26T23:59:59' );
			expect( ranking ).toContain( 'days=365' );
		} );

		it( 'draws the window in the site zone, not at UTC midnight', async () => {
			// The Stats endpoints resolve these to a local calendar day, so the
			// offset is load-bearing: with the boundaries computed at UTC instead,
			// a site in Los Angeles would rank over a window shifted seven hours.
			setSettings( {
				...defaultSettings,
				timezone: {
					string: 'America/Los_Angeles',
					offset: -7,
					offsetFormatted: '-7',
					abbr: 'PDT',
				},
			} );
			mockEndpoints();

			const { result } = renderHook( () => usePopularPost(), { wrapper } );

			await waitFor( () => expect( result.current.post?.id ).toBe( 7 ) );

			expect( result.current.range.from ).toBe( '2025-08-27T00:00:00.000-07:00' );
			expect( result.current.range.to ).toBe( '2026-08-26T23:59:59.999-07:00' );
			expect( decodeURIComponent( topPostsRequestPaths()[ 0 ] ) ).toContain(
				'start_date=2025-08-27T00:00:00.000-07:00'
			);
		} );

		it( 'reports the window it ranked over, for the card to link on', async () => {
			mockEndpoints();

			const { result } = renderHook( () => usePopularPost(), { wrapper } );

			await waitFor( () => expect( result.current.post?.id ).toBe( 7 ) );

			// The preset travels with the dates: the detail page recomputes the
			// range from it, and both its date control and the dashboard's render
			// it as a pill.
			expect( result.current.range.preset ).toBe( 'last-12-months' );
			expect( result.current.range.from ).toContain( '2025-08-27T00:00:00' );
			expect( result.current.range.to ).toContain( '2026-08-26T23:59:59' );
			// Whatever the detail page would have resolved for this window, so its
			// route has no incomplete window to seed.
			expect( result.current.range.interval ).toBe( 'month' );
		} );
	} );

	it( 'ranks once, with no comparison report and no re-rank on re-render', async () => {
		mockEndpoints();

		const { result, rerender } = renderHook( () => usePopularPost(), { wrapper } );

		await waitFor( () => expect( result.current.post?.id ).toBe( 7 ) );

		// The card renders no period-over-period delta, so a second ranking request
		// for a comparison window would be fetched and thrown away.
		expect( topPostsRequestPaths() ).toHaveLength( 1 );

		// Nothing the dashboard re-renders the widget for — a new date range, a
		// comparison toggle — reaches the request: the card reads no host params,
		// so it keeps ranking over its own window.
		rerender();

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );
		expect( topPostsRequestPaths() ).toHaveLength( 1 );
	} );
} );

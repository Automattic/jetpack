/**
 * External dependencies
 */
import {
	useQuery,
	type QueryClient,
	type UseQueryOptions,
	type UseQueryResult,
} from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { statsCommentFollowersQuery } from '../queries/stats-comment-followers-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsCommentFollowersParams,
	StatsCommentFollowersResponse,
} from '../queries/stats-comment-followers-query';

const COMMENT_FOLLOWERS_PAGE_SIZE = 20;
const COMMENT_FOLLOWERS_MAX_CONCURRENCY = 4;

export type { StatsCommentFollowersParams, StatsCommentFollowersResponse };

export function useStatsCommentFollowers(
	params: StatsCommentFollowersParams = {},
	options?: UseStatsOptions
): UseQueryResult< StatsCommentFollowersResponse > {
	return useStatsQuery< StatsCommentFollowersResponse >(
		statsCommentFollowersQuery( params ),
		options
	);
}

/**
 * Fetch every page from the paginated comment-followers endpoint.
 *
 * The endpoint caps `max` at 20, so the first response is used to discover the
 * total number of pages before the remaining pages are fetched. Each page uses
 * the normal Stats query factory so responses retain their individual cache
 * entries and normalization.
 *
 * `signal` stops further pages from being scheduled once the caller loses
 * interest. It cannot abort a request already in flight: `fetchQuery` owns each
 * page's own signal and takes no external one.
 *
 * @param queryClient - The React Query client.
 * @param signal      - Aborted when the consuming query is cancelled.
 * @return All normalized comment-followers pages.
 */
export async function fetchAllStatsCommentFollowers(
	queryClient: Pick< QueryClient, 'fetchQuery' >,
	signal?: AbortSignal
): Promise< StatsCommentFollowersResponse[] > {
	const firstPage = await queryClient.fetchQuery(
		statsCommentFollowersQuery( { page: 1, max: COMMENT_FOLLOWERS_PAGE_SIZE } )
	);
	const reportedPageCount = firstPage.summary.pages;
	const totalItems = firstPage.summary.total;
	let pageCount = 1;

	if ( typeof reportedPageCount === 'number' ) {
		pageCount = Math.max( 1, reportedPageCount );
	} else if ( typeof totalItems === 'number' ) {
		pageCount = Math.max( 1, Math.ceil( totalItems / COMMENT_FOLLOWERS_PAGE_SIZE ) );
	}

	const remainingPages = new Array< StatsCommentFollowersResponse >( pageCount - 1 );
	let nextPageIndex = 0;
	// `Promise.all` rejects on the first failure but does not stop the other
	// workers, so they would keep draining `nextPageIndex` long after the error
	// UI is up. Shared across workers so any failure drains the queue for all.
	let stopped = false;

	async function fetchNextPage(): Promise< void > {
		while ( nextPageIndex < remainingPages.length ) {
			if ( stopped || signal?.aborted ) {
				return;
			}

			const pageIndex = nextPageIndex;
			nextPageIndex += 1;

			try {
				remainingPages[ pageIndex ] = await queryClient.fetchQuery(
					statsCommentFollowersQuery( {
						page: pageIndex + 2,
						max: COMMENT_FOLLOWERS_PAGE_SIZE,
					} )
				);
			} catch ( error ) {
				stopped = true;
				throw error;
			}
		}
	}

	await Promise.all(
		Array.from(
			{ length: Math.min( COMMENT_FOLLOWERS_MAX_CONCURRENCY, remainingPages.length ) },
			() => fetchNextPage()
		)
	);

	return [ firstPage, ...remainingPages ];
}

/**
 * Query options for aggregating every comment-followers endpoint page.
 *
 * Individual page queries apply the shared retry policy through `fetchQuery`.
 * The aggregate query must not retry as well, or one page failure would
 * restart the entire batch after its own retries are exhausted.
 *
 * @return The all-pages query options.
 */
export function statsCommentFollowersAllPagesQuery(): UseQueryOptions<
	StatsCommentFollowersResponse[]
> {
	return {
		queryKey: [ 'stats', 'comment-followers', 'all-pages', COMMENT_FOLLOWERS_PAGE_SIZE ],
		queryFn: ( { client, signal } ) => fetchAllStatsCommentFollowers( client, signal ),
		retry: false,
	};
}

/**
 * Fetch all comment-follower rows for client-side report controls.
 *
 * @return The query result containing every normalized endpoint page.
 */
export function useStatsCommentFollowersAllPages(): UseQueryResult<
	StatsCommentFollowersResponse[]
> {
	return useQuery( statsCommentFollowersAllPagesQuery() );
}

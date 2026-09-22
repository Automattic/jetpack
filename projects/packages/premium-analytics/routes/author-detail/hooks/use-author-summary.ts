/**
 * External dependencies
 */
import {
	authorPostsQuery,
	authorSummaryQuery,
	useStatsQuery,
} from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { useCallback } from '@wordpress/element';
import type { AuthorPostsRecord, AuthorSummaryResponse } from '@jetpack-premium-analytics/data';

export type AuthorSummary = {
	name?: string;
	/** The author's avatar, when the users endpoint returns a safe http(s) one. */
	avatarUrl?: string;
	postCount?: number;
	/** Publish date of the author's oldest post, for "writing since". */
	firstPublishedDate?: string;
	isLoading: boolean;
	/** Whether the identity request failed; the page must not present a fallback name as real data. */
	isError: boolean;
	/** The failed request's error, for `describeError` to tell access denied from a retryable failure. */
	error: unknown;
	/** Whether the site knows no author by this id. */
	isNotFound: boolean;
	/** Re-runs the failed identity request, for the error state's Retry action. */
	refetch: () => void;
	/** Whether the post count and first publish date are still on their way. */
	isPostsLoading: boolean;
	/** Whether the posts request failed; the identity above still stands. */
	isPostsError: boolean;
};

/**
 * Resolve the header identity for one author: name and avatar from the users
 * endpoint, plus the post count and the date they started publishing from the
 * posts endpoint. The two requests fail independently, so a posts failure
 * leaves the name and the cards in place.
 *
 * @param authorId - The user ID from the route.
 * @return The resolved author summary.
 */
export function useAuthorSummary( authorId: number ): AuthorSummary {
	const { data, isLoading, isError, error, isSuccess, refetch } =
		useStatsQuery< AuthorSummaryResponse >( authorSummaryQuery( authorId ) );
	const posts = useStatsQuery< AuthorPostsRecord >( authorPostsQuery( authorId ) );

	// The query's own refetch takes a react-query options object; expose a
	// no-arg wrapper so callers can pass it straight to event handlers.
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	return {
		name: data?.name,
		// The avatar is remote data used verbatim as an image source, so it goes
		// through the shared http(s) guard like every other report URL.
		avatarUrl: safeHttpUrl( data?.avatarUrl ) ?? undefined,
		postCount: posts.data?.postCount,
		firstPublishedDate: posts.data?.firstPublishedDate ?? undefined,
		isLoading,
		isError,
		error,
		isNotFound: isSuccess && data === null,
		refetch: retry,
		isPostsLoading: posts.isLoading,
		isPostsError: posts.isError,
	};
}

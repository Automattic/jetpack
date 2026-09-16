/**
 * External dependencies
 */
import { authorSummaryQuery, useStatsQuery } from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { useCallback } from '@wordpress/element';
import type { AuthorSummaryResponse } from '@jetpack-premium-analytics/data';

export type AuthorSummary = {
	name?: string;
	/** The author's avatar, when the users endpoint returns a safe http(s) one. */
	avatarUrl?: string;
	postCount?: number;
	/** Publish date of the author's oldest post: the "writing since" and all-time anchor. */
	firstPublishedDate?: string;
	isLoading: boolean;
	/** Whether the summary request failed; the page must not present a fallback name as real data. */
	isError: boolean;
	/** Whether the site knows no author by this id. */
	isNotFound: boolean;
	/** Re-runs the failed request, for the error state's Retry action. */
	refetch: () => void;
};

/**
 * Resolve the header identity for one author: name, avatar, post count, and the
 * date they started publishing.
 *
 * @param authorId - The user ID from the route.
 * @return The resolved author summary.
 */
export function useAuthorSummary( authorId: number ): AuthorSummary {
	const { data, isLoading, isError, isSuccess, refetch } = useStatsQuery< AuthorSummaryResponse >(
		authorSummaryQuery( authorId )
	);

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
		postCount: data?.postCount,
		firstPublishedDate: data?.firstPublishedDate || undefined,
		isLoading,
		isError,
		isNotFound: isSuccess && data === null,
		refetch: retry,
	};
}

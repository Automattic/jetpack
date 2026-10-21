/**
 * External dependencies
 */
import { authorPostsQuery, getApiErrorCode, useStatsQuery } from '@jetpack-premium-analytics/data';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { toGmtInstant, useAuthorStats } from './use-author-stats';
import type { AuthorPostsRecord } from '@jetpack-premium-analytics/data';

export type AuthorSummary = {
	name?: string;
	/** The author's avatar, when the stats endpoint returns a safe http(s) one. */
	avatarUrl?: string;
	postCount?: number;
	/** When the author first published content of any type, for "writing since". */
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
	/** Whether the post count is still on its way. */
	isPostsLoading: boolean;
	/** Whether the posts request failed; the identity above still stands. */
	isPostsError: boolean;
};

// Covers the header's avatar box (72px when written) on 2x screens.
const AVATAR_SIZE = 144;

/**
 * Ask a Gravatar-style URL for an avatar sized to the header; one without an
 * `s` parameter is left as it is.
 *
 * @param url - A safe http(s) avatar URL.
 * @return The URL at the header's size.
 */
function sizeAvatarUrl( url: string ): string {
	const parsed = new URL( url );
	if ( ! parsed.searchParams.has( 's' ) ) {
		return url;
	}
	parsed.searchParams.set( 's', String( AVATAR_SIZE ) );
	return parsed.toString();
}

/**
 * Resolve the header for one author: name, avatar and first published content
 * from the `stats/author` request the page already makes for its All time
 * start, plus the published post count from the posts endpoint. The two fail
 * independently, so a posts failure leaves the name and the cards in place.
 *
 * @param authorId - The user ID from the route.
 * @return The resolved author summary.
 */
export function useAuthorSummary( authorId: number ): AuthorSummary {
	const source = useAuthorStats( authorId );
	const { isLoading, error, refetch } = source;
	const posts = useStatsQuery< AuthorPostsRecord >( authorPostsQuery( authorId ) );
	// Another author's identity, held as placeholder data, must not name this page.
	const stats = source.isPlaceholderData ? undefined : source.data?.report;
	const author = stats?.author;
	const isNotFound = getApiErrorCode( error ) === 'unknown_author';
	// A background refetch that fails keeps the identity it already has.
	const isError = source.isError && ! isNotFound && ! author;
	// The avatar is remote data used verbatim as an image source, so it goes
	// through the shared http(s) guard like every other report URL.
	const avatarUrl = safeHttpUrl( author?.avatarUrl );

	// The query's own refetch takes a react-query options object; expose a
	// no-arg wrapper so callers can pass it straight to event handlers.
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	return {
		name: author?.name,
		avatarUrl: avatarUrl ? sizeAvatarUrl( avatarUrl ) : undefined,
		postCount: posts.data?.postCount,
		firstPublishedDate: toGmtInstant( stats?.firstContentDate ),
		isLoading,
		isError,
		error: isError ? error : null,
		isNotFound,
		refetch: retry,
		isPostsLoading: posts.isLoading,
		isPostsError: posts.isError,
	};
}

/**
 * The name the page shows for a resolved author, shared by the header and the breadcrumb.
 *
 * @param summary - The resolved author summary.
 * @return The author's name, or a placeholder when it is blank.
 */
export function authorDisplayName( summary: Pick< AuthorSummary, 'name' > ): string {
	return summary.name?.trim() || __( 'Unnamed author', 'jetpack-premium-analytics-pkg' );
}

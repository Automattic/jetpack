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
import { useAuthorAllTimeStart } from './use-author-all-time-start';
import { toGmtInstant, useAuthorStats } from './use-author-stats';
import type { EntitySummary } from '../adapter';
import type { AuthorPostsRecord } from '@jetpack-premium-analytics/data';

export type AuthorSummary = EntitySummary & {
	name?: string;
	/** The author's avatar, when the stats endpoint returns a safe http(s) one. */
	avatarUrl?: string;
	postCount?: number;
	/** When the author first published content of any type, for "writing since". */
	firstPublishedDate?: string;
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
 * from the `stats/author` request that also anchors All time, plus the published
 * post count from the posts endpoint. The two fail independently, so a posts
 * failure leaves the name and the cards in place.
 *
 * @param authorId - The user ID from the route.
 * @return The resolved author summary.
 */
export function useAuthorSummary( authorId: number ): AuthorSummary {
	const source = useAuthorStats( authorId );
	const anchor = useAuthorAllTimeStart( authorId );
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
		title: author?.name,
		allTimeStart: anchor.allTimeStart,
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

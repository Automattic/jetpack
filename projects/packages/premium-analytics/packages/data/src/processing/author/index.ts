/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord } from '../stats/utils';

/** The author's published posts, as the header subtitle describes them. */
export type AuthorPostsRecord = {
	/** Published posts by this author, from the posts endpoint's total header. */
	postCount: number;
	/** Publish date of the author's oldest published post. */
	firstPublishedDate: string | null;
};

/**
 * Reduce the author's oldest published post and the posts endpoint's total to
 * the header subtitle's inputs.
 *
 * @param posts     - The raw posts page (one post, oldest first).
 * @param postCount - The `X-WP-Total` of that posts request.
 * @return The post count and first publish date.
 */
export function sanitizeAuthorPostsResponse(
	posts: unknown,
	postCount: unknown
): AuthorPostsRecord {
	const [ oldest ] = coerceStatsArray( posts );
	const oldestDate = coerceStatsRecord( oldest ).date;
	const total = safeParseFloat( postCount );

	return {
		postCount: Number.isInteger( total ) && total > 0 ? total : 0,
		firstPublishedDate: typeof oldestDate === 'string' ? oldestDate : null,
	};
}

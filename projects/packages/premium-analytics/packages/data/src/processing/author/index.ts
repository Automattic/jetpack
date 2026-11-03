/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';

/** The author's published posts, as the header subtitle counts them. */
export type AuthorPostsRecord = {
	/** Published posts by this author, from the posts endpoint's total header. */
	postCount: number;
};

/**
 * Read the posts endpoint's total as the author's published post count.
 *
 * @param postCount - The `X-WP-Total` of the author's posts request.
 * @return The post count.
 */
export function sanitizeAuthorPostsResponse( postCount: unknown ): AuthorPostsRecord {
	const total = safeParseFloat( postCount );

	return { postCount: Number.isInteger( total ) && total > 0 ? total : 0 };
}

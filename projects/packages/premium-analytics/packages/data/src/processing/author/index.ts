/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { decodeHtmlText } from '../../utils/text';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from '../stats/utils';

/** A site author, as the author detail page header needs it. */
export type AuthorSummaryRecord = {
	id: number;
	name: string;
	/** The largest avatar the users endpoint offers, or '' when it offers none. */
	avatarUrl: string;
	/** Published posts by this author, from the posts endpoint's total header. */
	postCount: number;
	/** Publish date of the author's oldest published post, or '' with no posts. */
	firstPublishedDate: string;
};

/** `null` when the users endpoint knows no such author. */
export type AuthorSummaryResponse = AuthorSummaryRecord | null;

// Largest first: the header renders the avatar at display size.
const PREFERRED_AVATAR_SIZES = [ '96', '48', '24' ];

function pickAvatarUrl( avatarUrls: unknown ): string {
	const sizes = coerceStatsRecord( avatarUrls );

	for ( const size of PREFERRED_AVATAR_SIZES ) {
		const url = sizes[ size ];
		if ( typeof url === 'string' && url ) {
			return url;
		}
	}

	return '';
}

/**
 * Combine a `wp/v2/users/<id>` record with the author's oldest published post
 * and the posts endpoint's total into one header summary.
 *
 * @param user      - The raw user record.
 * @param posts     - The raw posts page (one post, oldest first).
 * @param postCount - The `X-WP-Total` of that posts request.
 * @return The summary, or `null` when the user record is not a user.
 */
export function sanitizeAuthorSummaryResponse(
	user: unknown,
	posts: unknown,
	postCount: unknown
): AuthorSummaryResponse {
	if ( ! isStatsRecord( user ) ) {
		return null;
	}

	const id = safeParseFloat( user.id );
	if ( ! Number.isInteger( id ) || id <= 0 ) {
		return null;
	}

	const [ oldest ] = coerceStatsArray( posts );
	const oldestDate = coerceStatsRecord( oldest ).date;
	const total = safeParseFloat( postCount );

	return {
		id,
		name: decodeHtmlText( user.name, '' ),
		avatarUrl: pickAvatarUrl( user.avatar_urls ),
		postCount: Number.isInteger( total ) && total > 0 ? total : 0,
		firstPublishedDate: typeof oldestDate === 'string' ? oldestDate : '',
	};
}

import { safeParseFloat } from '../../utils/parsing';
import { decodeHtmlText } from '../../utils/text';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from './utils';

/**
 * One approved comment from the `posts/{id}/replies` endpoint (v1.1), most
 * recent first.
 */
export type StatsPostComment = {
	ID: number;
	name: string;
	avatar_URL?: string;
	/** The comment permalink. */
	URL?: string;
	/** When the comment was published, as an ISO 8601 date-time. */
	date?: string;
};

export type StatsPostCommentsResponse = {
	/** Total approved comments on the post, or `null` when the endpoint could not count them. */
	found: number | null;
	comments: StatsPostComment[];
};

function normalizeStatsPostComment( value: unknown ): StatsPostComment[] {
	if ( ! isStatsRecord( value ) ) {
		return [];
	}

	const comment = coerceStatsRecord( value );
	const author = coerceStatsRecord( comment.author );
	const id = safeParseFloat( comment.ID );
	const authorName = decodeHtmlText( author.name, '' ).trim();
	const authorLogin = typeof author.login === 'string' ? author.login.trim() : '';
	const name = authorName || authorLogin;

	if ( ! id || ! name ) {
		return [];
	}

	return [
		{
			ID: id,
			name,
			...( typeof author.avatar_URL === 'string' && author.avatar_URL
				? { avatar_URL: author.avatar_URL }
				: {} ),
			...( typeof comment.URL === 'string' && comment.URL ? { URL: comment.URL } : {} ),
			...( typeof comment.date === 'string' && comment.date ? { date: comment.date } : {} ),
		},
	];
}

/** The endpoint sends `-1` when it did not count (every typed request), which is not zero. */
function readFound( value: unknown ): number | null {
	const found = safeParseFloat( value, -1 );

	return found >= 0 ? found : null;
}

export function sanitizeStatsPostCommentsResponse( response: unknown ): StatsPostCommentsResponse {
	if ( ! isStatsRecord( response ) ) {
		return { found: null, comments: [] };
	}

	const payload = coerceStatsRecord( response );

	return {
		found: readFound( payload.found ),
		comments: coerceStatsArray( payload.comments ).flatMap( normalizeStatsPostComment ),
	};
}

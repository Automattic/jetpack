import { safeParseFloat } from '../../utils/parsing';
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
	/** Total approved comments on the post (the list itself is capped by `number`). */
	found: number;
	comments: StatsPostComment[];
};

function normalizeStatsPostComment( value: unknown ): StatsPostComment[] {
	if ( ! isStatsRecord( value ) ) {
		return [];
	}

	const comment = coerceStatsRecord( value );
	const author = coerceStatsRecord( comment.author );
	const id = safeParseFloat( comment.ID );
	const authorName = typeof author.name === 'string' ? author.name.trim() : '';
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

export function sanitizeStatsPostCommentsResponse( response: unknown ): StatsPostCommentsResponse {
	if ( ! isStatsRecord( response ) ) {
		return { found: 0, comments: [] };
	}

	const payload = coerceStatsRecord( response );

	return {
		found: safeParseFloat( payload.found ),
		comments: coerceStatsArray( payload.comments ).flatMap( normalizeStatsPostComment ),
	};
}

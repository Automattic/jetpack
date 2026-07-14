import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from './utils';

/**
 * One liker from the `posts/{id}/likes` endpoint. The endpoint returns user
 * rows with no like timestamp, so the list is recency-ordered but undated.
 */
export type StatsPostLike = {
	ID: number;
	name: string;
	login: string;
	avatar_URL?: string;
	profile_URL?: string;
};

export type StatsPostLikesResponse = {
	/** Total likes on the post (the list itself is capped by `number`). */
	found: number;
	likes: StatsPostLike[];
};

function normalizeStatsPostLike( value: unknown ): StatsPostLike[] {
	if ( ! isStatsRecord( value ) ) {
		return [];
	}

	const like = coerceStatsRecord( value );
	const id = safeParseFloat( like.ID );

	if ( ! id ) {
		return [];
	}

	return [
		{
			ID: id,
			name: typeof like.name === 'string' ? like.name : '',
			login: typeof like.login === 'string' ? like.login : '',
			...( typeof like.avatar_URL === 'string' ? { avatar_URL: like.avatar_URL } : {} ),
			...( typeof like.profile_URL === 'string' ? { profile_URL: like.profile_URL } : {} ),
		},
	];
}

export function sanitizeStatsPostLikesResponse( response: unknown ): StatsPostLikesResponse {
	if ( ! isStatsRecord( response ) ) {
		return { found: 0, likes: [] };
	}

	const payload = coerceStatsRecord( response );

	return {
		found: safeParseFloat( payload.found ),
		likes: coerceStatsArray( payload.likes ).flatMap( normalizeStatsPostLike ),
	};
}

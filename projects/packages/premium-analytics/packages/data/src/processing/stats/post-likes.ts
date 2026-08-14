import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from './utils';

/**
 * One liker from the `posts/{id}/likes` endpoint (v1.2), most recent first.
 */
export type StatsPostLike = {
	ID: number;
	name: string;
	login: string;
	avatar_URL?: string;
	/** When the like happened, normalized to ISO 8601 UTC. */
	date_liked?: string;
};

export type StatsPostLikesResponse = {
	/** Total likes on the post (the list itself is capped by `number`). */
	found: number;
	likes: StatsPostLike[];
};

/**
 * Normalize the endpoint's `date_liked` — a plain UTC `YYYY-MM-DD HH:mm:ss`
 * with no zone marker — to ISO 8601 so consumers can parse it with standard
 * tooling. Values already carrying a `T` (ISO) pass through untouched.
 *
 * @param value - The raw `date_liked` value.
 * @return The ISO 8601 date-time.
 */
function normalizeStatsPostLikeDate( value: string ): string {
	return value.includes( 'T' ) ? value : value.replace( ' ', 'T' ) + 'Z';
}

function normalizeStatsPostLike( value: unknown ): StatsPostLike[] {
	if ( ! isStatsRecord( value ) ) {
		return [];
	}

	const like = coerceStatsRecord( value );
	const id = safeParseFloat( like.ID );
	const name = typeof like.name === 'string' ? like.name.trim() : '';
	const login = typeof like.login === 'string' ? like.login.trim() : '';

	if ( ! id || ( ! name && ! login ) ) {
		return [];
	}

	return [
		{
			ID: id,
			name,
			login,
			...( typeof like.avatar_URL === 'string' ? { avatar_URL: like.avatar_URL } : {} ),
			...( typeof like.date_liked === 'string' && like.date_liked
				? { date_liked: normalizeStatsPostLikeDate( like.date_liked ) }
				: {} ),
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

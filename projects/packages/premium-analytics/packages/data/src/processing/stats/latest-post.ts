import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from './utils';

type StatsLatestPostRawNumeric = number | string;

type StatsLatestPostRawDiscussion = {
	comment_count?: StatsLatestPostRawNumeric;
};

export type StatsLatestPostRawItem = {
	ID?: StatsLatestPostRawNumeric;
	title?: string;
	URL?: string;
	date?: string;
	like_count?: StatsLatestPostRawNumeric;
	discussion?: StatsLatestPostRawDiscussion;
};

export type StatsLatestPostRawResponse = {
	found?: number;
	posts?: StatsLatestPostRawItem[];
};

export type StatsLatestPost = {
	id: number;
	title: string;
	url: string;
	date: string;
	likeCount: number;
	commentCount: number;
};

export type StatsLatestPostResponse = StatsLatestPost | null;

/**
 * Reduce a WPCOM posts-list response (`{ found, posts: [...] }`) to the first
 * post's headline fields. Returns null when the site has no posts, so callers
 * can treat "no latest post" distinctly from a zeroed-out post.
 *
 * @param response - Raw posts-list payload from the public WPCOM posts endpoint.
 * @return The normalized latest post, or null when none is present.
 */
export function sanitizeStatsLatestPostResponse( response: unknown ): StatsLatestPostResponse {
	if ( ! isStatsRecord( response ) ) {
		return null;
	}

	const [ first ] = coerceStatsArray( coerceStatsRecord( response ).posts );
	if ( ! isStatsRecord( first ) ) {
		return null;
	}

	const post = coerceStatsRecord( first );
	const discussion = coerceStatsRecord( post.discussion );

	return {
		id: safeParseFloat( post.ID ),
		title: typeof post.title === 'string' ? post.title : '',
		url: typeof post.URL === 'string' ? post.URL : '',
		date: typeof post.date === 'string' ? post.date : '',
		likeCount: safeParseFloat( post.like_count ),
		commentCount: safeParseFloat( discussion.comment_count ),
	};
}

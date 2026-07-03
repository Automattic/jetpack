import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from './utils';

type StatsLatestPostRawTitle = {
	rendered?: string;
};

export type StatsLatestPostRawItem = {
	id?: number | string;
	title?: StatsLatestPostRawTitle;
	link?: string;
	date?: string;
};

export type StatsLatestPost = {
	id: number;
	title: string;
	url: string;
	date: string;
};

export type StatsLatestPostResponse = StatsLatestPost | null;

/**
 * Reduce a core `/wp/v2/posts` response (an array of posts) to the first post's
 * headline fields. Content is read locally so it resolves regardless of site
 * privacy; the post's views, likes, and comments come from the Stats post
 * endpoint. Returns null when the site has no published post.
 *
 * @param response - Raw payload from the core posts endpoint.
 * @return The normalized latest post, or null when none is present.
 */
export function sanitizeStatsLatestPostResponse( response: unknown ): StatsLatestPostResponse {
	const [ first ] = coerceStatsArray( response );
	if ( ! isStatsRecord( first ) ) {
		return null;
	}

	const post = coerceStatsRecord( first );
	const id = safeParseFloat( post.id );
	if ( id <= 0 ) {
		return null;
	}

	const title = coerceStatsRecord( post.title );

	return {
		id,
		title: typeof title.rendered === 'string' ? title.rendered : '',
		url: typeof post.link === 'string' ? post.link : '',
		date: typeof post.date === 'string' ? post.date : '',
	};
}

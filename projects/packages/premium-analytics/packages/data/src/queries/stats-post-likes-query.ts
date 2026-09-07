/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsPostLikesResponse } from '../processing/stats';

export type StatsPostLikesParams = {
	postId: number;
	/** How many likers to return (the response's `found` carries the total). */
	number?: number;
};

export type { StatsPostLikesResponse };

export const statsPostLikesQuery = (
	params: StatsPostLikesParams
): StatsReportQueryOptions< 'postLikes' > => {
	const likesParams: StatsProxyParams = {
		...( params.number ? { number: params.number } : {} ),
	};

	return statsProxyQuery( {
		name: 'post-likes',
		// v1.2 matches stats-admin's Odyssey forward; the proxy sends this
		// endpoint unsigned (the likes endpoint rejects blog-token auth).
		version: '1.2',
		endpoint: `posts/${ params.postId }/likes`,
		params: likesParams,
		sanitizer: 'postLikes',
		enabled: Number.isInteger( params.postId ) && params.postId > 0,
	} );
};

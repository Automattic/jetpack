/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsPostCommentsResponse } from '../processing/stats';

export type StatsPostCommentsParams = {
	postId: number;
	/** How many comments to return (the response's `found` carries the total). */
	number?: number;
};

export type { StatsPostCommentsResponse };

export const statsPostCommentsQuery = (
	params: StatsPostCommentsParams
): StatsReportQueryOptions< 'postComments' > => {
	const commentParams: StatsProxyParams = {
		...( params.number ? { number: params.number } : {} ),
		// Keep this compact people roster to regular, approved comments. The
		// endpoint defaults to the same values, but spelling them out prevents
		// pingbacks or moderation state from changing the card's meaning.
		type: 'comment',
		status: 'approved',
		order: 'DESC',
	};

	return statsProxyQuery( {
		name: 'post-comments',
		version: '1.1',
		endpoint: `posts/${ params.postId }/replies`,
		params: commentParams,
		sanitizer: 'postComments',
		enabled: Number.isInteger( params.postId ) && params.postId > 0,
	} );
};

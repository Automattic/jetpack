/**
 * External dependencies
 */
import { getSiteData } from '@automattic/jetpack-script-data';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { sanitizeStatsLatestPostResponse } from '../processing/stats';
import type { StatsLatestPostResponse } from '../processing/stats';
import type { UseQueryOptions } from '@tanstack/react-query';

export type { StatsLatestPostResponse };

const WPCOM_PUBLIC_API_BASE = 'https://public-api.wordpress.com/rest/v1.1';

const LATEST_POST_QUERY_ARGS = {
	number: 1,
	status: 'publish',
	order_by: 'date',
	order: 'DESC',
	fields: 'ID,title,URL,date,like_count,discussion',
};

/**
 * The public WPCOM posts-list URL for a site's most recent published post. The
 * endpoint is public, so it is fetched directly — no proxy and no blog token.
 *
 * @param blogId - The connected site's WPCOM blog ID.
 * @return The absolute request URL.
 */
export function getLatestPostUrl( blogId: number ): string {
	return addQueryArgs(
		`${ WPCOM_PUBLIC_API_BASE }/sites/${ blogId }/posts/`,
		LATEST_POST_QUERY_ARGS
	);
}

/**
 * React Query options for the site's latest published post, fetched straight
 * from the public WPCOM posts endpoint. The blog ID comes from the dashboard's
 * client-side site data; the query stays disabled until it is known.
 *
 * @return The query options for the latest-post request.
 */
export function statsLatestPostQuery(): UseQueryOptions< StatsLatestPostResponse > {
	const blogId = getSiteData()?.wpcom?.blog_id ?? 0;

	return {
		queryKey: [ 'stats', 'latest-post', blogId ],
		queryFn: async () => {
			const response = await fetch( getLatestPostUrl( blogId ), {
				headers: { Accept: 'application/json' },
			} );

			if ( ! response.ok ) {
				throw new Error( `Latest post request failed with status ${ response.status }` );
			}

			return sanitizeStatsLatestPostResponse( await response.json() );
		},
		enabled: blogId > 0,
		placeholderData: previousData => previousData,
	};
}

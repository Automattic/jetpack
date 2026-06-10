/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { getStatsApiPath } from '../constants';

export type TopPostsPeriod = 'day' | 'week' | 'month' | 'year';

export type TopPostsPostView = {
	id: number;
	href: string;
	/**
	 * Publication date. `null` for pages without one (e.g. home, archives).
	 */
	date: string | null;
	title: string;
	type: string;
	views: number;
	video_play?: boolean;
	public?: boolean;
};

type TopPostsBucket = {
	postviews: TopPostsPostView[];
	total_views: number;
};

export type TopPostsResponse = {
	date: string;
	days: Record< string, TopPostsBucket >;
	summary?: TopPostsBucket;
};

export type RequestReportTopPostsParams = {
	period: TopPostsPeriod;
	/**
	 * Reference date within the period, YYYY-MM-DD.
	 */
	date: string;
	/**
	 * Maximum number of posts to return.
	 */
	num?: number;
};

/**
 * Fetch the top-viewed posts/pages via the Jetpack Stats proxy
 * (`jetpack/v4/stats-app`, provided by the jetpack-stats-admin package).
 *
 * @param params        - Request parameters.
 * @param params.period - Stats period granularity.
 * @param params.date   - Reference date within the period, YYYY-MM-DD.
 * @param params.num    - Maximum number of posts to return.
 */
export async function fetchReportTopPosts( {
	period,
	date,
	num,
}: RequestReportTopPostsParams ): Promise< TopPostsResponse > {
	// In the WPCOM stats API `max` caps the number of posts per period, while
	// `num` counts periods — leave `num` at its server default of 1.
	const path = addQueryArgs( `${ getStatsApiPath() }/top-posts`, {
		period,
		date,
		max: num,
	} );

	return apiFetch( { path } ) as Promise< TopPostsResponse >;
}

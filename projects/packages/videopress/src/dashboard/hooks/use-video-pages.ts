import { queryOptions, useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { VideoPages } from '../types/stats';

type VideoPagesQueryParams = {
	period: 'day' | 'week' | 'month' | 'year';
	num: number;
};

const REST_BASE = '/jetpack/v4/videopress/stats/video';

// Mirrors the proxy route's own defaults (period=day, num=30) so the
// query key stays stable whether the caller passes them or not.
const DEFAULT_PARAMS: VideoPagesQueryParams = { period: 'day', num: 30 };

/**
 * Tolerantly sanitize the WPCOM `stats/video/{post_id}` payload down to
 * the embedding-page URLs. The upstream shape is `{ data: [ [ date,
 * plays ], ... ], pages: [ url, ... ] }`, but only `pages[]` has a
 * consumer (the "Posts featuring this video" card) — the analytics
 * chart derives from the video-plays proxy instead, so the `data`
 * tuples are ignored rather than reshaped. The proxy forwards the
 * upstream body untouched, so the client survives missing keys,
 * non-array values, and non-string page entries.
 *
 * @param raw - Raw response body, of any shape.
 * @return Sanitized embedding-page URLs.
 */
export function sanitizeVideoPages( raw: unknown ): VideoPages {
	const pages: string[] = [];
	if ( raw && typeof raw === 'object' ) {
		const { pages: rawPages } = raw as { pages?: unknown };
		if ( Array.isArray( rawPages ) ) {
			for ( const page of rawPages ) {
				if ( typeof page === 'string' ) {
					pages.push( page );
				}
			}
		}
	}
	return { pages };
}

/**
 * TanStack Query options for the per-video `stats/video/{post_id}`
 * proxy. Sanitization happens in the queryFn so the cache only ever
 * holds the normalized shape.
 *
 * @param postId - Video (attachment) post ID.
 * @param params - Period/num window parameters.
 * @return queryOptions ready to pass to `useQuery`.
 */
export function videoPagesQueryOptions(
	postId: number | string,
	params: VideoPagesQueryParams = DEFAULT_PARAMS
) {
	return queryOptions( {
		queryKey: [ 'jetpack-videopress-stats', 'video-pages', String( postId ), params ],
		queryFn: async () => {
			const raw = await apiFetch< unknown >( {
				path: addQueryArgs( `${ REST_BASE }/${ postId }`, params ),
			} );
			return sanitizeVideoPages( raw );
		},
	} );
}

/**
 * Fetch and cache the URLs of the posts/pages embedding a video, from
 * `/jetpack/v4/videopress/stats/video/{post_id}`.
 *
 * @param postId - Video (attachment) post ID; falsy disables the query.
 * @param params - Optional period/num overrides (defaults: day, 30).
 * @return Sanitized page URLs and loading/error state.
 */
export function useVideoPages(
	postId: number | string,
	params: Partial< VideoPagesQueryParams > = {}
) {
	const query = useQuery( {
		...videoPagesQueryOptions( postId, { ...DEFAULT_PARAMS, ...params } ),
		enabled: Boolean( postId ),
	} );

	return {
		pages: query.data?.pages ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
	};
}

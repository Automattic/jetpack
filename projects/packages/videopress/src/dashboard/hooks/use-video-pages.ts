import { queryOptions, useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { VideoDailyPlay, VideoPages } from '../types/stats';

type VideoPagesQueryParams = {
	period: 'day' | 'week' | 'month' | 'year';
	num: number;
};

const REST_BASE = '/jetpack/v4/videopress/stats/video';

// Mirrors the proxy route's own defaults (period=day, num=30) so the
// query key stays stable whether the caller passes them or not.
const DEFAULT_PARAMS: VideoPagesQueryParams = { period: 'day', num: 30 };

/**
 * Tolerantly sanitize the WPCOM `stats/video/{post_id}` payload. The
 * expected shape is `{ data: [ [ date, plays ], ... ], pages: [ url,
 * ... ] }`, but the proxy forwards the upstream body untouched, so the
 * client survives missing keys, non-array values, and malformed rows:
 * rows without a string date are dropped, non-numeric plays become 0,
 * and non-string pages are dropped.
 *
 * @param raw - Raw response body, of any shape.
 * @return Sanitized daily plays and embedding-page URLs.
 */
export function sanitizeVideoPages( raw: unknown ): VideoPages {
	const dailyPlays: VideoDailyPlay[] = [];
	const pages: string[] = [];
	if ( raw && typeof raw === 'object' ) {
		const { data, pages: rawPages } = raw as { data?: unknown; pages?: unknown };
		if ( Array.isArray( data ) ) {
			for ( const row of data ) {
				if ( ! Array.isArray( row ) || typeof row[ 0 ] !== 'string' ) {
					continue;
				}
				const plays = Number( row[ 1 ] );
				dailyPlays.push( { date: row[ 0 ], plays: Number.isFinite( plays ) ? plays : 0 } );
			}
		}
		if ( Array.isArray( rawPages ) ) {
			for ( const page of rawPages ) {
				if ( typeof page === 'string' ) {
					pages.push( page );
				}
			}
		}
	}
	return { dailyPlays, pages };
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
 * Fetch and cache the per-video plays series and embedding-page URLs
 * from `/jetpack/v4/videopress/stats/video/{post_id}`.
 *
 * @param postId - Video (attachment) post ID; falsy disables the query.
 * @param params - Optional period/num overrides (defaults: day, 30).
 * @return Sanitized daily plays, page URLs, and loading/error state.
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
		dailyPlays: query.data?.dailyPlays ?? [],
		pages: query.data?.pages ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
	};
}

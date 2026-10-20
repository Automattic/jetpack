import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useRef } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { type ApiMediaItem, privacyStringToInt, toLibraryItem } from '../utils/library-item';
import { nextProcessingPoll, type ProcessingPollAnchor } from '../utils/processing-poll';
import type { LibraryItem, LibraryItemPrivacy } from '../types/library';
import type { View } from '@wordpress/dataviews';

const REST_PATH = '/wp/v2/media';

type PaginationInfo = { totalItems: number; totalPages: number };

const SUPPORTED_ORDERBY = new Set( [ 'title', 'date', 'slug' ] );

// DataViews field id → /wp/v2/media `orderby` value. Fields not in
// this map are forwarded as-is and filtered by SUPPORTED_ORDERBY.
// Attachment slugs are auto-generated from the upload filename, so
// orderby=slug approximates a filename sort.
const SORT_FIELD_MAP: Record< string, string > = {
	uploadDate: 'date',
	filename: 'slug',
};

/**
 * Convert a DataViews View into REST API query arguments for /wp/v2/media.
 *
 * @param view - The current DataViews view state (sort, filters, pagination, search).
 * @return A plain object of query args suitable for addQueryArgs.
 */
export function viewToQueryArgs( view: View ): Record< string, string | number > {
	// WordPress.com Simple rejects the `media_type` param (HTTP 400) and never tags
	// VideoPress items with the `video/videopress` mime — VideoPress data lives in
	// wpcom's videos table, not postmeta. Privacy and type filters are still honored
	// server-side there: the package's `rest_attachment_query` PHP filter resolves
	// them into post__in / post__not_in ID sets from the videos table, so totals stay
	// exact and there's no client-side over-fetch.
	const simple = isSimpleSite();
	const args: Record< string, string | number > = {
		page: view.page ?? 1,
		per_page: view.perPage ?? 12,
	};
	if ( ! simple ) {
		args.media_type = 'video';
		args.mime_type = 'video/*';
		// Hide local attachments that already have a VideoPress sibling (they
		// carry the `_videopress_uploaded_id` post-meta). The sibling is the
		// row we want to surface; the original local is a leftover that would
		// let users try to re-upload it. Off-Simple only: the meta is written
		// by the videopress/v1 promote flow, which can't run on Simple, and
		// the wpcom filter branch doesn't implement the param.
		args.videopress_hide_already_uploaded = 1;
	} else {
		// `media_type` is rejected (HTTP 400) and `mime_type=video/*` doesn't
		// narrow the query on Simple; this custom param is handled by the
		// package's PHP `rest_attachment_query` filter (post_mime_type LIKE
		// 'video/%'), keeping the X-WP-Total headers exact.
		args.videopress_only_videos = 1;
	}

	const rawSortField = view.sort?.field;
	const sortField = rawSortField ? ( SORT_FIELD_MAP[ rawSortField ] ?? rawSortField ) : undefined;
	if ( sortField && SUPPORTED_ORDERBY.has( sortField ) ) {
		args.orderby = sortField;
		args.order = view.sort?.direction ?? 'desc';
	}

	const search = view.search?.trim();
	if ( search ) {
		args.search = search;
	}

	for ( const filter of view.filters ?? [] ) {
		if ( filter.value === undefined || filter.value === null || filter.value === 'all' ) {
			continue;
		}
		if ( filter.field === 'privacy' ) {
			// Honored on both hosts. Off-Simple the package's PHP
			// rest_attachment_query filter turns this into a postmeta meta_query;
			// on Simple it resolves the effective-visibility ID set from wpcom's
			// videos table (post__in). Same param either way.
			args.videopress_privacy_setting = String(
				privacyStringToInt( filter.value as LibraryItemPrivacy )
			);
		} else if ( filter.field === 'type' ) {
			if ( filter.value === 'videopress' ) {
				if ( simple ) {
					// Constrain to wpcom videos-table members. The package's PHP
					// rest_attachment_query filter resolves this into a post__in
					// ID set, on top of the always-sent `videopress_only_videos`
					// mime constraint, so X-WP-Total stays exact.
					args.videopress_has_guid = 1;
				} else {
					// Off-Simple: narrow the mime filter to video/videopress and
					// drop media_type — empirically, setting both broadens the
					// query and returns non-videopress items too.
					delete args.media_type;
					args.mime_type = 'video/videopress';
				}
			} else if ( filter.value === 'local' ) {
				// Both hosts: exclude VideoPress items via the package's PHP
				// rest_attachment_query filter. Off-Simple that's a postmeta
				// NOT EXISTS on videopress_guid; on Simple it's a post__not_in of
				// the videos-table members.
				args.no_videopress = 1;
			}
		} else if ( filter.field === 'uploadDate' ) {
			// DataViews emits the value from <input type=datetime-local>
			// as a local-time string; convert to UTC ISO8601 for the WP
			// REST API. Only `before` and `after` are supported here
			// (matching the field's filterBy.operators allowlist).
			const parsed = new Date( filter.value as string );
			if ( ! Number.isNaN( parsed.getTime() ) ) {
				const iso = parsed.toISOString();
				if ( filter.operator === 'before' ) {
					args.before = iso;
				} else if ( filter.operator === 'after' ) {
					args.after = iso;
				}
			}
		}
	}

	return args;
}

/**
 * Fetch one raw page of /wp/v2/media results.
 *
 * @param args - Query args for addQueryArgs (page/per_page included).
 * @return The raw items plus the pagination headers.
 */
async function fetchMediaPage(
	args: Record< string, string | number >
): Promise< { raw: ApiMediaItem[]; totalItems: number; totalPages: number } > {
	const response = ( await apiFetch( {
		path: addQueryArgs( REST_PATH, args ),
		parse: false,
	} ) ) as Response;
	const totalItems = Number( response.headers.get( 'X-WP-Total' ) ?? 0 );
	const totalPages = Number( response.headers.get( 'X-WP-TotalPages' ) ?? 0 );
	const raw = ( await response.json() ) as ApiMediaItem[];
	return { raw, totalItems, totalPages };
}

/**
 * Fetch a page of VideoPress media items from the REST API.
 *
 * Every filter — privacy, type, search, date — is a server-side WP_Query
 * constraint (on Simple via the videos-table ID sets resolved in the package's
 * `rest_attachment_query` PHP filter, which also restricts the query to
 * `post_mime_type` video; off-Simple via mime + postmeta), so this is always a
 * single request whose rows match its exact `X-WP-Total` / `X-WP-TotalPages`
 * headers. No client-side re-filtering: dropping a row here couldn't fix the
 * server-derived totals, only desynchronize the two.
 *
 * @param view - The current DataViews view (sort, filters, search, pagination).
 * @return Items array and pagination metadata derived from response headers.
 */
async function fetchLibrary(
	view: View
): Promise< { items: LibraryItem[]; paginationInfo: PaginationInfo } > {
	const simple = isSimpleSite();
	const args = viewToQueryArgs( view );
	const { raw, totalItems, totalPages } = await fetchMediaPage( args );
	return {
		items: raw.map( item => toLibraryItem( item, simple ) ),
		paginationInfo: { totalItems, totalPages },
	};
}

/**
 * Fetch and cache the VideoPress media library from /wp/v2/media.
 *
 * @param view         - The current DataViews view (sort, filters, search, pagination).
 * @param options      - Query options.
 * @param options.poll - Poll processing items visible in the library.
 * @return Items, loading/error state, pagination info, and a refetch callback.
 */
export function useLibrary( view: View, { poll = true }: { poll?: boolean } = {} ) {
	// Anchor for when the current processing set was first seen, so the
	// VIDP-298 poll cap can measure elapsed time across refetches without
	// causing re-renders. Stored in a ref, not state, so mutating it never
	// re-runs the hook or the interval callback.
	const processingStartRef = useRef< ProcessingPollAnchor | null >( null );

	const query = useQuery( {
		// Every filter (privacy, type, sort, search, page, perPage) is now
		// encoded in the server query args, so they alone key the cache.
		queryKey: [ LIBRARY_QUERY_KEY, viewToQueryArgs( view ) ],
		queryFn: () => fetchLibrary( view ),
		placeholderData: keepPreviousData,
		// Only visible library items need processing updates; counts change on mutations.
		refetchInterval: q => {
			const { anchor, interval } = nextProcessingPoll(
				processingStartRef.current,
				( poll ? ( q.state.data?.items ?? [] ) : [] )
					.filter( item => item.isProcessing )
					.map( item => item.id ),
				Date.now()
			);
			processingStartRef.current = anchor;
			return interval;
		},
		// The dashboard disables focus refetches globally, but while something
		// is processing a return to the tab is exactly when the user expects
		// fresh state — and it's the recovery path once the poll cap above has
		// fired: a transcode that genuinely outlasts the cap flips to ready on
		// the next focus instead of never.
		refetchOnWindowFocus: q =>
			poll && q.state.data?.items.some( item => item.isProcessing ) ? 'always' : false,
	} );

	return {
		items: query.data?.items ?? [],
		isLoading: query.isLoading,
		paginationInfo: query.data?.paginationInfo ?? { totalItems: 0, totalPages: 0 },
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}

export const LIBRARY_QUERY_KEY = 'jetpack-videopress-library' as const;

// Second tuple segment of item-detail query keys
// ([ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, id ] — see use-video.ts).
// Shared so cache invalidation can address list vs item queries without
// re-encoding the key shape at each site.
export const LIBRARY_ITEM_QUERY_SEGMENT = 'item' as const;

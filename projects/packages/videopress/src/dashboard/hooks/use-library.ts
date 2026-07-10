import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';
import { flattenVideoTracks } from '../../client/lib/video-tracks';
import { buildShortcode } from '../utils/format';
import { isSimpleSite } from '../utils/is-simple';
import type { VideoTracksResponseBodyProps } from '../../client/types';
import type { LibraryItem, LibraryItemPrivacy } from '../types/library';
import type { View } from '@wordpress/dataviews';

const REST_PATH = '/wp/v2/media';

type ApiMediaItem = {
	id: number;
	title?: { rendered?: string };
	slug?: string;
	source_url?: string;
	date?: string;
	mime_type?: string;
	media_details?: {
		length?: number;
		filesize?: number;
		width?: number;
		height?: number;
		videopress?: { duration?: number; poster?: string; finished?: boolean };
		// WordPress.com Simple exposes the ready poster + duration directly on
		// `media_details` (there's no `videopress` sub-object there).
		thumb?: string;
		duration_milliseconds?: number;
	};
	jetpack_videopress?: {
		guid?: string;
		rating?: string;
		display_embed?: 0 | 1 | boolean;
		allow_download?: 0 | 1 | boolean;
		privacy_setting?: 0 | 1 | 2;
		is_private?: boolean;
		description?: string;
		caption?: string;
		tracks?: VideoTracksResponseBodyProps;
	};
};

type PaginationInfo = { totalItems: number; totalPages: number };

const SUPPORTED_ORDERBY = new Set( [ 'title', 'date', 'slug' ] );

// Over-fetch bounds for the Simple client-side filter path: up to 3 pages
// of 100 items (~300 rows) fetched in parallel before filtering locally.
const CLIENT_FILTER_PER_PAGE = 100;
const CLIENT_FILTER_MAX_PAGES = 3;

// DataViews field id → /wp/v2/media `orderby` value. Fields not in
// this map are forwarded as-is and filtered by SUPPORTED_ORDERBY.
// Attachment slugs are auto-generated from the upload filename, so
// orderby=slug approximates a filename sort.
const SORT_FIELD_MAP: Record< string, string > = {
	uploadDate: 'date',
	filename: 'slug',
};

const PRIVACY_TO_INT: Record< LibraryItemPrivacy, 0 | 1 | 2 > = {
	public: 0,
	private: 1,
	'site-default': 2,
};

const PRIVACY_FROM_INT: Record< 0 | 1 | 2, LibraryItemPrivacy > = {
	0: 'public',
	1: 'private',
	2: 'site-default',
};

/**
 * Map a UI privacy string to its WPCOM integer code.
 *
 * @param value - The UI privacy string ('public' | 'private' | 'site-default').
 * @return The corresponding WPCOM integer (0 | 1 | 2).
 */
export function privacyStringToInt( value: LibraryItemPrivacy ): 0 | 1 | 2 {
	return PRIVACY_TO_INT[ value ];
}

/**
 * Map a WPCOM privacy integer to its UI string representation.
 *
 * @param value - The WPCOM integer code (0 | 1 | 2 | undefined).
 * @return The corresponding UI privacy string.
 */
export function privacyIntToString( value: 0 | 1 | 2 | undefined ): LibraryItemPrivacy {
	if ( value === undefined ) {
		return 'site-default';
	}
	return PRIVACY_FROM_INT[ value ] ?? 'site-default';
}

/**
 * Convert a DataViews View into REST API query arguments for /wp/v2/media.
 *
 * @param view - The current DataViews view state (sort, filters, pagination, search).
 * @return A plain object of query args suitable for addQueryArgs.
 */
export function viewToQueryArgs( view: View ): Record< string, string | number > {
	// WordPress.com Simple rejects the `media_type` param (HTTP 400) and never tags
	// VideoPress items with the `video/videopress` mime, so the server-side type
	// filters below are gated off `simple`; the VideoPress-vs-local split is driven by
	// `jetpack_videopress.guid` presence in toLibraryItem instead. Privacy/type
	// filters are applied client-side there (see getClientSideFilters).
	const simple = isSimpleSite();
	const args: Record< string, string | number > = {
		mime_type: 'video/*',
		page: view.page ?? 1,
		per_page: view.perPage ?? 12,
		// Always hide local attachments that already have a VideoPress
		// sibling (they carry the `_videopress_uploaded_id` post-meta).
		// The sibling is the row we want to surface; the original local
		// is a leftover that would let users try to re-upload it.
		videopress_hide_already_uploaded: 1,
	};
	if ( ! simple ) {
		args.media_type = 'video';
	} else {
		// `mime_type=video/*` doesn't narrow the query on Simple; this custom
		// param is handled by the package's PHP `rest_attachment_query` filter
		// (post_mime_type LIKE 'video/%'), keeping the X-WP-Total headers exact.
		args.videopress_only_videos = 1;
	}

	const rawSortField = view.sort?.field;
	const sortField = rawSortField ? SORT_FIELD_MAP[ rawSortField ] ?? rawSortField : undefined;
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
			// On WordPress.com Simple the server ignores this param (it's backed
			// by a postmeta query, and VideoPress data lives in WPCOM's videos
			// table); the filter is applied client-side in fetchLibrary instead.
			if ( simple ) {
				continue;
			}
			args.videopress_privacy_setting = String(
				privacyStringToInt( filter.value as LibraryItemPrivacy )
			);
		} else if ( filter.field === 'type' ) {
			// On WordPress.com Simple the server can't narrow by VideoPress type:
			// `video/videopress` returns nothing (videos keep their original mime)
			// and `no_videopress` is a self-hosted-only PHP filter. The type
			// filter is applied client-side in fetchLibrary instead, using the
			// `jetpack_videopress.guid`-derived type label.
			if ( simple ) {
				continue;
			}
			// `videopress`: narrow the mime filter to video/videopress and
			// drop media_type — empirically, setting both broadens the
			// query and returns non-videopress items too.
			// `local`: keep the default video filter and add the
			// no_videopress flag handled by the package's PHP
			// rest_attachment_query filter.
			if ( filter.value === 'videopress' ) {
				delete args.media_type;
				args.mime_type = 'video/videopress';
			} else if ( filter.value === 'local' ) {
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

type ClientSideFilters = {
	privacy?: LibraryItemPrivacy;
	type?: LibraryItem[ 'type' ];
};

/**
 * Extract the view filters that must be applied client-side on
 * WordPress.com Simple, where the server can't narrow by VideoPress
 * privacy or type (both are postmeta-backed off-platform; the data
 * lives in WPCOM's videos table there).
 *
 * @param view - The current DataViews view state.
 * @return The active client-side filters, or `null` when none apply.
 */
export function getClientSideFilters( view: View ): ClientSideFilters | null {
	const filters: ClientSideFilters = {};
	for ( const filter of view.filters ?? [] ) {
		if ( filter.value === undefined || filter.value === null || filter.value === 'all' ) {
			continue;
		}
		if ( filter.field === 'privacy' ) {
			filters.privacy = filter.value as LibraryItemPrivacy;
		} else if ( filter.field === 'type' ) {
			filters.type = filter.value as LibraryItem[ 'type' ];
		}
	}
	return filters.privacy !== undefined || filters.type !== undefined ? filters : null;
}

/**
 * Whether a mapped LibraryItem passes the active client-side filters.
 *
 * Privacy semantics mirror the server-side filter: `private`/`public`
 * match the *effective* visibility (`isPrivate`, which folds in the
 * site default), while `site-default` matches the item's own stored
 * setting.
 *
 * @param item    - The mapped library item.
 * @param filters - Active client-side filters from getClientSideFilters.
 * @return `true` when the item satisfies every active filter.
 */
export function matchesClientSideFilters( item: LibraryItem, filters: ClientSideFilters ): boolean {
	if ( filters.privacy === 'private' && ! item.isPrivate ) {
		return false;
	}
	if ( filters.privacy === 'public' && item.isPrivate ) {
		return false;
	}
	if ( filters.privacy === 'site-default' && item.privacy !== 'site-default' ) {
		return false;
	}
	if ( filters.type !== undefined && item.type !== filters.type ) {
		return false;
	}
	return true;
}

/**
 * Transform a raw /wp/v2/media API item into a LibraryItem.
 *
 * @param raw    - The raw media item from the REST API response.
 * @param simple - Whether the dashboard is running on WordPress.com Simple (drives the media-shape branch).
 * @return A normalized LibraryItem for the VideoPress library UI.
 */
function toLibraryItem( raw: ApiMediaItem, simple: boolean ): LibraryItem {
	const vp = raw.jetpack_videopress;
	const isVideoPress = Boolean( vp?.guid );
	const details = raw.media_details;
	// Self-hosted nests poster/duration/finished under `media_details.videopress`;
	// WordPress.com Simple omits that sub-object and returns a ready-to-play `thumb` +
	// `duration_milliseconds` on `media_details` itself.
	const vpDetails = details?.videopress;
	const durationMs = simple ? details?.duration_milliseconds : vpDetails?.duration;
	const durationSeconds =
		durationMs !== undefined ? Math.floor( durationMs / 1000 ) : details?.length ?? 0;
	// On Simple `media_details.thumb` is a bare filename, not a URL — the ready
	// poster lives on the VideoPress CDN keyed by the video guid (same URL shape
	// the editor uses for chapter/thumbnail files).
	const poster =
		simple && vp?.guid && details?.thumb
			? `https://videos.files.wordpress.com/${ vp.guid }/${ details.thumb }`
			: vpDetails?.poster;
	const finished = vpDetails?.finished;
	// Simple items from /wp/v2/media are already transcoded and carry no in-progress
	// signal, so nothing is ever "processing" there. The self-hosted heuristic —
	// VideoPress item with no poster yet or finished=false — is preserved unchanged.
	const isProcessing = ! simple && isVideoPress && ( ! poster || finished === false );
	return {
		id: String( raw.id ),
		guid: vp?.guid ?? '',
		type: isVideoPress ? 'videopress' : 'local',
		title: decodeEntities( raw.title?.rendered ?? raw.slug ?? '' ),
		filename: raw.source_url?.split( '/' ).pop() ?? '',
		thumbnailUrl: poster ?? null,
		durationSeconds,
		uploadDate: raw.date ?? '',
		privacy: privacyIntToString( vp?.privacy_setting ),
		isPrivate: Boolean( vp?.is_private ),
		fileSizeBytes: raw.media_details?.filesize ?? 0,
		upload: { status: 'idle', progress: 0 },
		description: vp?.description ?? '',
		rating: ( vp?.rating ?? 'G' ) as LibraryItem[ 'rating' ],
		displayEmbed: Boolean( vp?.display_embed ),
		allowDownloads: Boolean( vp?.allow_download ),
		shortcode: buildShortcode( vp?.guid, raw.media_details?.width, raw.media_details?.height ),
		sourceUrl: raw.source_url,
		isProcessing,
		// The media REST field omits `tracks` today, so this is seed-only:
		// the caption manager modal fetches the authoritative list itself.
		tracks: flattenVideoTracks( vp?.tracks ),
	};
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
 * Drop non-video rows on WordPress.com Simple. The mime is the
 * discriminator on purpose: filtering on `jetpack_videopress.guid`
 * presence instead would let poster jpegs (which carry no guid)
 * masquerade as "local videos" — guid only labels videopress-vs-local
 * among actual videos.
 *
 * @param raw    - Raw media items from the REST API.
 * @param simple - Whether the dashboard runs on WordPress.com Simple.
 * @return The rows to map into LibraryItems.
 */
function keepOnlyVideos( raw: ApiMediaItem[], simple: boolean ): ApiMediaItem[] {
	if ( ! simple ) {
		return raw;
	}
	return raw.filter( item => item.mime_type?.startsWith( 'video/' ) );
}

/**
 * Fetch a page of VideoPress media items from the REST API.
 *
 * On WordPress.com Simple with an active privacy/type filter, the
 * server can't narrow the query, so this over-fetches a bounded window
 * (up to CLIENT_FILTER_MAX_PAGES × CLIENT_FILTER_PER_PAGE rows, in
 * parallel and preserving server order), filters client-side, and
 * paginates the filtered list locally. Tradeoff: libraries with more
 * than ~300 videos get truncated filter results (matches beyond the
 * window are invisible) — accepted until server-side filter parity
 * lands on Simple. The unfiltered browse path stays a single request
 * with server-provided totals.
 *
 * @param view - The current DataViews view (sort, filters, search, pagination).
 * @return Items array and pagination metadata derived from response headers.
 */
async function fetchLibrary(
	view: View
): Promise< { items: LibraryItem[]; paginationInfo: PaginationInfo } > {
	const simple = isSimpleSite();
	const args = viewToQueryArgs( view );
	const clientFilters = simple ? getClientSideFilters( view ) : null;

	if ( ! clientFilters ) {
		const { raw, totalItems, totalPages } = await fetchMediaPage( args );
		return {
			items: keepOnlyVideos( raw, simple ).map( item => toLibraryItem( item, simple ) ),
			paginationInfo: { totalItems, totalPages },
		};
	}

	const windowArgs = { ...args, page: 1, per_page: CLIENT_FILTER_PER_PAGE };
	const first = await fetchMediaPage( windowArgs );
	const pageCount = Math.min( first.totalPages, CLIENT_FILTER_MAX_PAGES );
	const restPages = await Promise.all(
		Array.from( { length: Math.max( pageCount - 1, 0 ) }, ( _, i ) =>
			fetchMediaPage( { ...windowArgs, page: i + 2 } )
		)
	);
	const raw = [ first, ...restPages ].flatMap( page => page.raw );
	const filtered = keepOnlyVideos( raw, simple )
		.map( item => toLibraryItem( item, simple ) )
		.filter( item => matchesClientSideFilters( item, clientFilters ) );

	const page = view.page ?? 1;
	const perPage = view.perPage ?? 12;
	return {
		items: filtered.slice( ( page - 1 ) * perPage, page * perPage ),
		paginationInfo: {
			totalItems: filtered.length,
			totalPages: Math.ceil( filtered.length / perPage ),
		},
	};
}

/**
 * Fetch and cache the VideoPress media library from /wp/v2/media.
 *
 * @param view - The current DataViews view (sort, filters, search, pagination).
 * @return Items, loading/error state, pagination info, and a refetch callback.
 */
export function useLibrary( view: View ) {
	const query = useQuery( {
		// Filters and page/perPage are keyed explicitly: on WordPress.com
		// Simple the privacy/type filters are applied client-side and thus
		// no longer encoded in the server query args.
		queryKey: [
			'jetpack-videopress-library',
			viewToQueryArgs( view ),
			view.filters ?? [],
			view.page ?? 1,
			view.perPage ?? 12,
		],
		queryFn: () => fetchLibrary( view ),
		placeholderData: keepPreviousData,
		// While any item on the current page is still being processed
		// by the VideoPress backend (no poster yet / finished=false),
		// re-fetch every 2s so the placeholder is replaced as soon as
		// the data is ready. React-query pauses this when the tab is
		// hidden, so it's cheap.
		refetchInterval: q => ( q.state.data?.items.some( item => item.isProcessing ) ? 2000 : false ),
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

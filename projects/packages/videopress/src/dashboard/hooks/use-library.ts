import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';
import { flattenVideoTracks } from '../../client/lib/video-tracks';
import { buildShortcode } from '../utils/format';
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
	const args: Record< string, string | number > = {
		media_type: 'video',
		mime_type: 'video/*',
		page: view.page ?? 1,
		per_page: view.perPage ?? 12,
		// Always hide local attachments that already have a VideoPress
		// sibling (they carry the `_videopress_uploaded_id` post-meta).
		// The sibling is the row we want to surface; the original local
		// is a leftover that would let users try to re-upload it.
		videopress_hide_already_uploaded: 1,
	};

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
			args.videopress_privacy_setting = String(
				privacyStringToInt( filter.value as LibraryItemPrivacy )
			);
		} else if ( filter.field === 'type' ) {
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

/**
 * Transform a raw /wp/v2/media API item into a LibraryItem.
 *
 * @param raw - The raw media item from the REST API response.
 * @return A normalized LibraryItem for the VideoPress library UI.
 */
function toLibraryItem( raw: ApiMediaItem ): LibraryItem {
	const vp = raw.jetpack_videopress;
	const isVideoPress = Boolean( vp?.guid );
	const vpDurationMs = raw.media_details?.videopress?.duration;
	const durationSeconds =
		vpDurationMs !== undefined ? Math.floor( vpDurationMs / 1000 ) : raw.media_details?.length ?? 0;
	const poster = raw.media_details?.videopress?.poster;
	const finished = raw.media_details?.videopress?.finished;
	const isProcessing = isVideoPress && ( ! poster || finished === false );
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
 * Fetch a page of VideoPress media items from the REST API.
 *
 * @param view - The current DataViews view (sort, filters, search, pagination).
 * @return Items array and pagination metadata derived from response headers.
 */
async function fetchLibrary(
	view: View
): Promise< { items: LibraryItem[]; paginationInfo: PaginationInfo } > {
	const args = viewToQueryArgs( view );
	const response = ( await apiFetch( {
		path: addQueryArgs( REST_PATH, args ),
		parse: false,
	} ) ) as Response;
	const totalItems = Number( response.headers.get( 'X-WP-Total' ) ?? 0 );
	const totalPages = Number( response.headers.get( 'X-WP-TotalPages' ) ?? 0 );
	const raw = ( await response.json() ) as ApiMediaItem[];
	return {
		items: raw.map( toLibraryItem ),
		paginationInfo: { totalItems, totalPages },
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
		queryKey: [ 'jetpack-videopress-library', viewToQueryArgs( view ) ],
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

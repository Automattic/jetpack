import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { buildShortcode } from '../utils/format';
import type { LibraryItemPrivacy, MockLibraryItem } from '../types/library';
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
		videopress?: { duration?: number };
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
		poster?: string;
	};
};

type PaginationInfo = { totalItems: number; totalPages: number };

const SUPPORTED_ORDERBY = new Set( [ 'title', 'date' ] );

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
	};

	const sortField = view.sort?.field === 'uploadDate' ? 'date' : view.sort?.field;
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
		}
		// `type` filter (local vs videopress) is a client-side partition.
	}

	return args;
}

/**
 * Transform a raw /wp/v2/media API item into a MockLibraryItem.
 *
 * @param raw - The raw media item from the REST API response.
 * @return A normalized MockLibraryItem for the VideoPress library UI.
 */
function toLibraryItem( raw: ApiMediaItem ): MockLibraryItem {
	const vp = raw.jetpack_videopress;
	const isVideoPress = Boolean( vp?.guid );
	const vpDurationMs = raw.media_details?.videopress?.duration;
	const durationSeconds =
		vpDurationMs !== undefined ? Math.floor( vpDurationMs / 1000 ) : raw.media_details?.length ?? 0;
	return {
		id: String( raw.id ),
		guid: vp?.guid ?? '',
		type: isVideoPress ? 'videopress' : 'local',
		title: raw.title?.rendered ?? raw.slug ?? '',
		filename: raw.source_url?.split( '/' ).pop() ?? '',
		thumbnailUrl: vp?.poster ?? null,
		durationSeconds,
		uploadDate: raw.date ?? '',
		privacy: privacyIntToString( vp?.privacy_setting ),
		isPrivate: Boolean( vp?.is_private ),
		fileSizeBytes: raw.media_details?.filesize ?? 0,
		upload: { status: 'idle', progress: 0 },
		description: vp?.description ?? '',
		rating: ( vp?.rating ?? 'G' ) as MockLibraryItem[ 'rating' ],
		displayEmbed: Boolean( vp?.display_embed ),
		allowDownloads: Boolean( vp?.allow_download ),
		shortcode: buildShortcode( vp?.guid, raw.media_details?.width, raw.media_details?.height ),
		sourceUrl: raw.source_url,
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
): Promise< { items: MockLibraryItem[]; paginationInfo: PaginationInfo } > {
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
